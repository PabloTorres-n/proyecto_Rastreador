import { Component, inject, OnDestroy } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonFab, IonFabButton, IonBadge } from '@ionic/angular/standalone';
import { MapService } from '../services/map'; 
import { MascotasService } from '../services/mascotas'; 
import { addIcons } from 'ionicons';
import { locate, layers, shieldCheckmark, chevronBackOutline, paperPlane, personOutline } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonFab, IonFabButton, IonBadge]
})
export class HomePage implements OnDestroy {
  private navCtrl = inject(NavController);
  private watchId: any;
  private seleccionSub: Subscription | null = null;
  private routeSub: Subscription | null = null; // Nueva suscripción para limpiar
  private route = inject(ActivatedRoute);
  
  public mascotasService = inject(MascotasService);
  public mapService = inject(MapService);

  constructor() {
    addIcons({ shieldCheckmark, locate, layers, 'chevron-back-outline': chevronBackOutline, 'paper-plane': paperPlane, 'person-outline': personOutline });
  }

  // Usamos ionViewDidEnter para inicializar el mapa CADA VEZ que la vista es activa
async ionViewDidEnter() {
    

  // 1. Inicializar
  this.mapService.initMap('mapId', [20.6736, -103.344], 15);
  const yaRecargado = sessionStorage.getItem('mapa_listo');

  if (!yaRecargado) {
    sessionStorage.setItem('mapa_listo', 'true');
    console.log('🔄 Forzando recarga de sincronización...');
    window.location.reload(); // Recarga la página completa
    return; // Detenemos la ejecución aquí, la página se refrescará
  }

  // 2. Esperar a que el mapa emita el evento 'load' o pase el tiempo de animación
  if (this.mapService.map) {
    this.mapService.map.whenReady(() => {
      setTimeout(() => {
        this.mapService.map.invalidateSize();
        this.cargarDatosIniciales();
        this.startTracking();
        this.escucharSeleccionMascota();
        
        // Manejar el petId de la URL
        this.route.queryParams.subscribe(params => {
          if (params['petId']) {
            setTimeout(() => this.enfocarMascotaDirecto(params['petId']), 1000);
          }
        });
      }, 500); // 500ms de gracia tras el 'ready'
    });
  }
}

  // IMPORTANTE: Limpiar procesos cuando la pantalla deja de ser la principal
  ionViewWillLeave() {
    console.log('🗑️ Limpiando mapa al salir...');
    this.stopTracking();
    if (this.seleccionSub) this.seleccionSub.unsubscribe();
    if (this.routeSub) this.routeSub.unsubscribe();
    
    // Si tu MapService tiene una función de limpieza, úsala:
    if (this.mapService.map) {
      this.mapService.map.remove();
      this.mapService.map = null;
    }
  }

  private cargarDatosIniciales() {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      const user = JSON.parse(userStr);
      const userId = user.id || user._id;
      if (userId) {
        // Nos aseguramos de que la carga sea fresca
        this.mascotasService.cargarMascotasDesdeBD(userId).subscribe();
      }
    }
  }

  private enfocarMascotaDirecto(id: string) {
    // Esperamos a que los marcadores se dibujen (proceso asíncrono)
    setTimeout(() => {
      const marker = this.mapService.mascotaMarkers[id];
      if (marker) {
        const coords = marker.getLatLng();
        this.mapService.irAMascota(coords.lat, coords.lng, id);
      }
    }, 1200); 
  }

  private escucharSeleccionMascota() {
    if (this.seleccionSub) this.seleccionSub.unsubscribe();
    this.seleccionSub = this.mascotasService.getMascotaSeleccionada().subscribe(pet => {
      if (pet?.lat) {
        // Pequeño delay para dejar que el mapa respire
        setTimeout(() => {
          this.mapService.irAMascota(pet.lat, pet.lng, pet._id);
          this.mascotasService.limpiarSeleccion();
        }, 500);
      }
    });
  }

  async centrarEnMi() {
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.mapService.actualizarMarcadorUsuario(position.coords.latitude, position.coords.longitude);
      this.mapService.centrarEnUsuario();
    } catch (e) {
      console.error('Error GPS:', e);
    }
  }

  async startTracking() {
    this.stopTracking(); // Evitar duplicar el watch
    try {
      this.watchId = await Geolocation.watchPosition({ 
        enableHighAccuracy: true,
        timeout: 5000 
      }, (pos) => {
        if (pos) {
          this.mapService.actualizarMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
        }
      });
    } catch (e) {
      console.error("Error iniciando seguimiento:", e);
    }
  }

  private stopTracking() {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  ngOnDestroy() {
    this.stopTracking();
    if (this.seleccionSub) this.seleccionSub.unsubscribe();
    if (this.routeSub) this.routeSub.unsubscribe();
  }
}