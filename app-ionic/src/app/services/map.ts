import { Injectable, inject } from '@angular/core';
import { MascotasService } from './mascotas';
import { io, Socket } from 'socket.io-client';
import { Geolocation } from '@capacitor/geolocation';
import { environment } from '../../environments/environment';

// Declaración para que TypeScript no proteste por Leaflet
declare var L: any;

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mascotasService = inject(MascotasService);
  
  // Propiedades públicas para acceso desde componentes
  public map: any = null;
  public mascotaMarkers: { [id: string]: any } = {};
  public lastUserCoords: [number, number] | null = null;
  
  private socket: Socket;
  private userMarker: any = null;
  private rutaGroup: any = null; 
  private mascotaEnSeguimiento: string | null = null;
  private isRouting = false;

  constructor() {
    // Asegúrate de que esta URL sea la de tu backend (ej. Vercel o local)
    this.socket = io(environment.apiUrl.replace('/api', ''));
  }

  /**
   * Inicializa el mapa y limpia estados previos
   */
  initMap(elementId: string, center: [number, number], zoom: number): any {
    // 1. Limpieza profunda si ya existía un mapa
    if (this.map) {
      this.map.off(); 
      this.map.remove();
      this.map = null;
    }

    // 2. Reset de estados para evitar "fantasmas" al volver de otra pantalla
    this.mascotaMarkers = {};
    this.userMarker = null;
    this.isRouting = false;
    this.mascotaEnSeguimiento = null;

    // 3. Crear instancia
    this.map = L.map(elementId, { 
      zoomControl: false,
      renderer: L.canvas() // Canvas mejora el rendimiento en móviles
    }).setView(center, zoom);

    // 4. Capa base (CartoDB para un look moderno)
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/${isDark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`, {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // 5. Capa para la ruta (encima de todo)
    this.map.createPane('rutaPane');
    this.map.getPane('rutaPane').style.zIndex = '450';
    this.rutaGroup = L.featureGroup().addTo(this.map);

    // 6. Sockets en tiempo real
    this.socket.on('posicion-actualizada', (data: any) => {
      this.actualizarPosicionMascotaRealtime(data);
    });

    // 7. Cargar marcadores iniciales desde el servicio
    this.mascotasService.getMascotas().subscribe((mascotas: any[]) => {
      mascotas?.forEach(pet => this.dibujarOActualizarMascota(pet));
    });

    // 8. Activar GPS inicial
    this.localizacionInicialAutomática();

    return this.map;
  }

  /**
   * Dibuja el icono y configura el Popup con el botón "IR AHORA"
   */
  private dibujarOActualizarMascota(pet: any) {
    const petId = pet._id;
    const latlng: [number, number] = [pet.lat, pet.lng];

    const customIcon = L.divIcon({
      className: 'custom-pet-marker',
      html: `
        <div style="background: white; border: 2px solid #f97316; color: #f97316; width: 42px; height: 42px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 900; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          ${pet.nombre[0].toUpperCase()}
        </div>`,
      iconSize: [42, 42]
    });

    const popupHTML = `
      <div style="text-align: center; min-width: 120px;">
        <b style="font-size: 1.1em;">${pet.nombre}</b><br>
        <span style="color: #666;">Batería: ${pet.bateria}%</span><br>
        <button id="btn-ir-${petId}" style="margin-top: 10px; background: #f97316; color: white; border: none; padding: 10px; border-radius: 8px; width: 100%; font-weight: bold; cursor: pointer;">
          IR AHORA
        </button>
      </div>
    `;

    if (this.mascotaMarkers[petId]) {
      this.mascotaMarkers[petId].setLatLng(latlng);
      this.mascotaMarkers[petId].getPopup().setContent(popupHTML);
    } else {
      const marker = L.marker(latlng, { icon: customIcon, zIndexOffset: 1000 })
        .addTo(this.map)
        .bindPopup(popupHTML, { closeButton: false });

      // Escuchar cuando se abre el popup para conectar el botón
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-ir-${petId}`);
        if (btn) {
          btn.onclick = () => {
            this.irAMascota(pet.lat, pet.lng, petId);
            this.map.closePopup();
          };
        }
      });

      this.mascotaMarkers[petId] = marker;
    }
  }

  /**
   * Maneja el movimiento por Sockets sin temblores
   */
  private actualizarPosicionMascotaRealtime(data: any) {
    const id = String(data.petId || data._id || '').trim();
    const marker = this.mascotaMarkers[id];

    if (marker) {
      const nLat = parseFloat(data.lat);
      const nLng = parseFloat(data.lng);

      // requestAnimationFrame evita que el icono "tiemble"
      requestAnimationFrame(() => {
        marker.setLatLng([nLat, nLng]);
        if (this.mascotaEnSeguimiento === id) {
          this.map.panTo([nLat, nLng], { animate: true });
        }
      });

      // Recalcular ruta si estamos en seguimiento (cada 5 segundos para no saturar)
      if (this.mascotaEnSeguimiento === id && this.lastUserCoords && !this.isRouting) {
        this.isRouting = true;
        setTimeout(() => {
          this.trazarRuta(this.lastUserCoords![0], this.lastUserCoords![1], nLat, nLng);
        }, 5000);
      }
    }
  }

  /**
   * Centra en la mascota y fuerza la creación de la ruta
   */
  async irAMascota(lat: number, lng: number, petId?: string) {
    if (!this.map) return;
    this.map.invalidateSize(); // Asegurar que el mapa detecta su tamaño real

    if (petId) this.mascotaEnSeguimiento = petId;

    // Si el GPS no estaba listo, lo forzamos ahora
    if (!this.lastUserCoords) {
      try {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        this.actualizarMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
      } catch (e) {
        console.warn("GPS no disponible aún");
      }
    }

    // Zoom fluido
    this.map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });

    // Esperar a que termine el zoom para trazar la ruta (evita errores de renderizado)
    setTimeout(() => {
      if (this.lastUserCoords) {
        this.trazarRuta(this.lastUserCoords[0], this.lastUserCoords[1], lat, lng);
      }
    }, 1200);
  }

  /**
   * Lógica de trazado con OSRM
   */
private trazarRuta(slat: number, slng: number, elat: number, elng: number) {
  // 1. Validación básica de números
  if (!slat || !slng || !elat || !elng || isNaN(slat) || isNaN(slng)) return;

  // 2. VERIFICACIÓN CRÍTICA: ¿El mapa puede proyectar coordenadas?
  // Si el mapa no está listo, latLngToLayerPoint lanzará error o dará 0.
  try {
    const testPoint = this.map.latLngToLayerPoint([slat, slng]);
    if (!testPoint || isNaN(testPoint.x)) {
      console.warn("⚠️ Mapa no proyectable aún. Reintentando en breve...");
      setTimeout(() => this.trazarRuta(slat, slng, elat, elng), 500);
      return;
    }
  } catch (e) {
    return; // Evita el crash si el mapa está en estado inconsistente
  }

  const url = `https://router.project-osrm.org/route/v1/foot/${slng},${slat};${elng},${elat}?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.code === 'Ok' && data.routes?.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
        
        if (this.rutaGroup && this.map) {
          this.rutaGroup.clearLayers();
          
          // Creamos la línea pero SIN añadirla al mapa todavía
          const polyline = L.polyline(coords, {
            color: '#f97316',
            weight: 6,
            opacity: 0.8,
            pane: 'rutaPane',
            interactive: false 
          });

          // Solo añadimos y ajustamos si los bordes son válidos
          const bounds = polyline.getBounds();
          if (bounds.isValid()) {
            polyline.addTo(this.rutaGroup);
            
            // Usamos un timeout mínimo para que el hilo de ejecución de JS respire
            setTimeout(() => {
              try {
                this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
              } catch (err) {
                console.error("Error en fitBounds protegido");
              }
            }, 100);
          }
        }
      }
      this.isRouting = false;
    })
    .catch(() => this.isRouting = false);
}
  /**
   * Gestión del punto azul del usuario
   */
  actualizarMarcadorUsuario(lat: number, lng: number) {
    this.lastUserCoords = [lat, lng];
    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-dot',
        html: `<div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(59,130,246,0.6);"></div>`,
        iconSize: [16, 16]
      });
      this.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
    }
  }

  private async localizacionInicialAutomática() {
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.actualizarMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
    } catch (e) {
      console.log("Esperando señal GPS...");
    }
  }

  async centrarEnUsuario() {
    if (this.lastUserCoords && this.map) {
      this.map.flyTo(this.lastUserCoords, 17, { animate: true });
    }
  }

  destroyMap() {
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
      this.mascotaMarkers = {};
      this.userMarker = null;
      this.isRouting = false;
      console.log('🗑️ Mapa destruido para evitar conflictos');
    }
  }
}