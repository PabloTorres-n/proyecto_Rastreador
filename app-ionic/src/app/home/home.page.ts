import { Component, inject, OnDestroy } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonFabButton, IonBadge } from '@ionic/angular/standalone';
import { MapService } from '../services/map'; 
import { MascotasService } from '../services/mascotas'; 
import { addIcons } from 'ionicons';
import { locate, layers, shieldCheckmark } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { Subscription } from 'rxjs'; // Para limpiar memoria

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonFabButton, IonBadge]
})
export class HomePage implements OnDestroy {
  watchId: any;
  updateInterval: any; // Temporizador para el polling
  private seleccionSub: Subscription | null = null; // Suscripción de la mascota elegida

  private mascotasService = inject(MascotasService);
  private mapService = inject(MapService); // Usamos inject también aquí por consistencia

  constructor() {
    addIcons({ shieldCheckmark, locate, layers });
  }

  async ionViewDidEnter() {
    console.log('🚀 Iniciando mapa y motor de seguimiento...');
    
    setTimeout(() => {
      // 1. Inicializar mapa
      this.mapService.initMap('mapId', [20.6736, -103.344], 15);

      // 2. Carga inicial de datos y Configuración del Polling (cada 5 seg)
      this.iniciarActualizacionAutomatica();

      // 3. ESCUCHAR SI VIENE UNA MASCOTA DESDE EL LISTADO
      this.seleccionSub = this.mascotasService.getMascotaSeleccionada().subscribe(pet => {
        if (pet && pet.lat && pet.lng) {
          console.log('🎯 Mascota recibida del listado:', pet.nombre);
          // Le damos un pequeño respiro al mapa para que termine de cargar
          setTimeout(() => {
            this.mapService.irAMascota(pet.lat, pet.lng);
            // Limpiamos para que no se repita el viaje si sales y entras
            this.mascotasService.limpiarSeleccion();
          }, 600);
        }
      });

      this.startTracking();
    }, 500);
  }

  // --- NUEVA FUNCIÓN: Polling de base de datos ---
  iniciarActualizacionAutomatica() {
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    const userId = user.id || user._id;

    if (userId) {
      // Primera carga manual
      this.mascotasService.cargarMascotasDesdeBD(userId).subscribe();

      // Ciclo repetitivo cada 5 segundos
      this.updateInterval = setInterval(() => {
        this.mascotasService.cargarMascotasDesdeBD(userId).subscribe({
          next: () => console.log('🔄 Sincronizado con MongoDB'),
          error: (e) => console.error('❌ Error de sincronización', e)
        });
      }, 5000);
    }
  }

  ionViewWillLeave() {
    this.detenerTodo();
  }

  ngOnDestroy() {
    this.detenerTodo();
  }

  private detenerTodo() {
    this.stopTracking();
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.seleccionSub) this.seleccionSub.unsubscribe();
    this.mapService.destroyMap();
  }

  // ... (tus funciones startTracking, stopTracking y centrar se quedan igual)

  startTracking() {
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.mapService.actualizarMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => console.error('Error GPS:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }

  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async centrar() {
    try {
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location === 'granted') {
        const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        this.mapService.actualizarMarcadorUsuario(coordinates.coords.latitude, coordinates.coords.longitude);
        this.mapService.centrarEnUsuario();
      }
    } catch (e) {
      console.error('Error centrar:', e);
    }
  }
}