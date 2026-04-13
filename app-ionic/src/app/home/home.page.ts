import { Component, inject, OnDestroy } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonFab, IonFabButton, IonBadge, IonModal, IonButton, IonSearchbar } from '@ionic/angular/standalone';
import { MapService } from '../services/map'; 
import { MascotasService } from '../services/mascotas'; 
import { addIcons } from 'ionicons';
import { locate, layers, shieldCheckmark, chevronBackOutline, paperPlane, personOutline, batteryCharging, pin, paw, timeOutline, mapOutline, navigate } from 'ionicons/icons'; 
import { Geolocation } from '@capacitor/geolocation';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router'; // Añadido Router
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonFab, IonFabButton, IonBadge, IonModal, IonButton, IonSearchbar]
})
export class HomePage implements OnDestroy {
  private navCtrl = inject(NavController);
  private router = inject(Router); // Inyectado para irAlPerfil
  private watchId: any;
  private seleccionSub: Subscription | null = null;
  private routeSub: Subscription | null = null;
  private route = inject(ActivatedRoute);
  
  public mascotasService = inject(MascotasService);
  public mapService = inject(MapService);

  // --- VARIABLES DE ESTADO Y UBICACIÓN ---
  public mostrarDetalle = false;
  public mascotaSeleccionada: any = null;
  public distanciaReal: string = 'Calculando...';
  // CORRECCIÓN: Declaración de la variable que faltaba
  public miUbicacion: { lat: number, lng: number } | null = null;

  constructor() {
    addIcons({ 
      shieldCheckmark, locate, layers, personOutline, paperPlane, paw,
      'chevron-back-outline': chevronBackOutline, 
      'battery-charging': batteryCharging,
      'pin': pin, 'time-outline': timeOutline, 'map-outline': mapOutline,
      'navigate': navigate
    });
  }

  onSearchChange(event: any) {
    const valor = event.detail.value;
    console.log('Buscando:', valor);
  }

 async ionViewDidEnter() {
    // 1. Manejo del reload necesario por Leaflet/Ionic al usar standalone components
    const yaRecargado = sessionStorage.getItem('mapa_listo');
    if (!yaRecargado) {
      sessionStorage.setItem('mapa_listo', 'true');
      console.log('🔄 Forzando recarga inicial paraLeaflet');
      window.location.reload();
      return;
    }

    // 2. UNA SOLA inicialización limpia con un pequeño delay
    setTimeout(() => {
      // Centro por defecto si no hay GPS (Guadalajara)
      const defaultCenter: [number, number] = [20.6736, -103.344];
      console.log('🌍 Inicializando Mapa Único');
      this.mapService.initMap('mapId', defaultCenter, 15);

      if (this.mapService.map) {
        this.mapService.map.whenReady(() => {
          // Aseguramos que Leaflet detecte su tamaño real
          this.mapService.map.invalidateSize();
          this.cargarDatosIniciales();
          this.startTracking();
          this.escucharSeleccionMascota();
          
          // Manejo de queryParams para notificaciones
          this.routeSub = this.route.queryParams.subscribe(params => {
            if (params['petId']) {
              setTimeout(() => this.enfocarMascotaDirecto(params['petId']), 1000);
            }
          });
        });
      }
    }, 500); // 500ms es un tiempo seguro para que el DOM esté listo
  }

  // --- SEGUIMIENTO GPS EN TIEMPO REAL ---
  async startTracking() {
    this.stopTracking();
    try {
      this.watchId = await Geolocation.watchPosition({ 
        enableHighAccuracy: true,
        timeout: 5000 
      }, (pos) => {
        if (pos) {
          // Guardamos nuestra ubicación para el cálculo de distancia
          this.miUbicacion = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          this.mapService.actualizarMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
          
          // Si el modal está abierto, recalculamos la distancia en vivo
          if (this.mostrarDetalle) {
            this.actualizarCalculos();
          }
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

  private escucharSeleccionMascota() {
    if (this.seleccionSub) this.seleccionSub.unsubscribe();
    this.seleccionSub = this.mascotasService.getMascotaSeleccionada().subscribe(pet => {
      if (pet?.lat) {
        this.mascotaSeleccionada = pet;
        this.actualizarCalculos(); // Calcular distancia inmediatamente
        this.mostrarDetalle = true;

        setTimeout(() => {
          this.mapService.map.flyTo([pet.lat, pet.lng], 16);
          this.mascotasService.limpiarSeleccion();
        }, 300);
      }
    });
  }

  // --- CÁLCULOS DE DISTANCIA Y ESTADO ---
  actualizarCalculos() {
    if (this.miUbicacion && this.mascotaSeleccionada) {
      this.distanciaReal = this.calcularDistancia(
        this.miUbicacion.lat, this.miUbicacion.lng,
        this.mascotaSeleccionada.lat, this.mascotaSeleccionada.lng
      );
    } else {
      this.distanciaReal = 'Esperando GPS...';
    }
  }

  calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d > 1000 ? `${(d / 1000).toFixed(2)} km` : `${Math.round(d)} m`;
  }

  obtenerEstadoSenal(mascota: any) {
    if (!mascota?.ultimaConexion) return 'desconectado';
    const ahora = new Date().getTime();
    const fechaConexion = new Date(mascota.ultimaConexion).getTime();
    const fechaGPS = mascota.ultimaActualizacion ? new Date(mascota.ultimaActualizacion).getTime() : 0;
    const margen = (mascota.intervalo || 15000) * 2.5;

    if ((ahora - fechaConexion) > margen) return 'desconectado';
    if (fechaGPS === 0 || (fechaConexion - fechaGPS) > 90000) return 'sin_gps';
    return 'en_vivo';
  }

  // --- NAVEGACIÓN ---
  irAlPerfil() {
    if (this.mascotaSeleccionada) {
      this.mostrarDetalle = false;
      this.router.navigate(['/perfil-mascota', this.mascotaSeleccionada._id]);
    }
  }

  trazarRutaAMascota() {
    if (this.mascotaSeleccionada) {
      this.mostrarDetalle = false;
      this.mapService.irAMascota(
        this.mascotaSeleccionada.lat, 
        this.mascotaSeleccionada.lng, 
        this.mascotaSeleccionada._id
      );
    }
  }

  private cargarDatosIniciales() {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      const user = JSON.parse(userStr);
      const userId = user.id || user._id;
      if (userId) {
        this.mascotasService.cargarMascotasDesdeBD(userId).subscribe();
      }
    }
  }

  private enfocarMascotaDirecto(id: string) {
    setTimeout(() => {
      const marker = this.mapService.mascotaMarkers[id];
      if (marker) {
        const coords = marker.getLatLng();
        const listaMascotas = this.mascotasService['mascotasSubject'].value; 
        this.mascotaSeleccionada = listaMascotas.find((m: any) => (m._id === id || m.id === id));

        if (!this.mascotaSeleccionada) {
          this.mascotaSeleccionada = { _id: id, nombre: 'Mascota', lat: coords.lat, lng: coords.lng };
        }

        this.actualizarCalculos();
        this.mostrarDetalle = true;
        this.mapService.map.flyTo([coords.lat, coords.lng], 16);
      }
    }, 1200); 
  }

  async centrarEnMi() {
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.miUbicacion = { lat: position.coords.latitude, lng: position.coords.longitude };
      this.mapService.actualizarMarcadorUsuario(this.miUbicacion.lat, this.miUbicacion.lng);
      this.mapService.centrarEnUsuario();
      if (this.mostrarDetalle) this.actualizarCalculos();
    } catch (e) {
      console.error('Error GPS:', e);
    }
  }

  ngOnDestroy() {
    this.stopTracking();
    if (this.seleccionSub) this.seleccionSub.unsubscribe();
    if (this.routeSub) this.routeSub.unsubscribe();
  }
}