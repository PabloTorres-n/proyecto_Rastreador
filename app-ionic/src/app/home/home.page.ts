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

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonFab, IonFabButton, IonBadge]
})
export class HomePage implements OnDestroy {
  private watchId: any;
  private seleccionSub: Subscription | null = null;
  private route = inject(ActivatedRoute);
  // Inyectamos los servicios
  private mascotasService = inject(MascotasService);
  private mapService = inject(MapService);

  constructor() {
    // Registramos todos los iconos que usaremos en el mapa
    addIcons({ 
      shieldCheckmark, 
      locate, 
      layers, 
      'chevron-back-outline': chevronBackOutline,
      'paper-plane': paperPlane,
      'person-outline': personOutline
    });
  }

  async ionViewDidEnter() {
    console.log('🛰️ Motor de Rastreo Real-Time Iniciado');
    
    // Inicializar el mapa
    this.mapService.initMap('mapId', [20.6736, -103.344], 15);

    this.cargarDatosIniciales();
    this.escucharSeleccionMascota();
    this.startTracking();

    // 3. CAPTURAR EL ID DE LA URL (Query Params)
    this.route.queryParams.subscribe(params => {
      const petId = params['petId'];
      if (petId) {
        console.log('📍 Buscando mascota desde listado con ID:', petId);
        this.enfocarMascotaDirecto(petId);
      }
    })}

  private cargarDatosIniciales() {
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    const userId = user.id || user._id;
    if (userId) {
      this.mascotasService.cargarMascotasDesdeBD(userId).subscribe();
    }
  }

  private enfocarMascotaDirecto(id: string) {
    // Damos un tiempo a que el servicio cargue las mascotas de la BD
    setTimeout(() => {
      const marker = this.mapService['mascotaMarkers'][id]; // Acceso al diccionario del service
      if (marker) {
        const coords = marker.getLatLng();
        this.mapService.irAMascota(coords.lat, coords.lng, id); // Pasamos el ID para activar el seguimiento
      } else {
        // Si aún no carga, reintentamos una vez más en 1 segundo
        console.warn('Reintentando localizar marcador...');
      }
    }, 1200); 
  }

  private escucharSeleccionMascota() {
    // Si vienes de la lista de mascotas y le diste a "Localizar"
    this.seleccionSub = this.mascotasService.getMascotaSeleccionada().subscribe(pet => {
      if (pet && pet.lat && pet.lng) {
        console.log(`🎯 Enfocando a: ${pet.nombre}`);
        // Pequeño timeout para que Leaflet procese el tamaño del contenedor
        setTimeout(() => {
          this.mapService.irAMascota(pet.lat, pet.lng);
          // Limpiamos la selección para que no se repita el viaje al re-entrar
          this.mascotasService.limpiarSeleccion();
        }, 700);
      }
    });
  }
async centrar() {
    // Llamamos al método que acabamos de asegurar en el Service
    await this.mapService.centrarEnUsuario();
  }
  // --- BOTONES DE ACCIÓN ---

  /**
   * Botón para centrar la cámara en TI (El punto azul)
   */
  async centrarEnMi() {
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      this.mapService.actualizarMarcadorUsuario(lat, lng);
      // El service ya tiene el método para centrar
      this.mapService.centrarEnUsuario();
    } catch (e) {
      console.error('Error al obtener ubicación manual:', e);
    }
  }

  /**
   * Botón para fijar la vista en una mascota específica (Si la tienes cargada)
   */
  fijarMascota(pet: any) {
    if (pet && pet.lat) {
      this.mapService.irAMascota(pet.lat, pet.lng);
    }
  }

  // --- CICLO DE VIDA Y GPS ---

  startTracking() {
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.mapService.actualizarMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => console.error('Error GPS Real-time:', err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  }

  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  ionViewWillLeave() {
    this.detenerServicios();
  }

  ngOnDestroy() {
    this.detenerServicios();
  }

  private detenerServicios() {
    this.stopTracking();
    if (this.seleccionSub) this.seleccionSub.unsubscribe();
    this.mapService.destroyMap();
  }
}