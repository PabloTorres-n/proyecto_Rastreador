import { Injectable, inject } from '@angular/core';
import { MascotasService } from './mascotas';

// Hack para que TypeScript reconozca Leaflet globalmente
declare var L: any;

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mascotasService = inject(MascotasService);
  private map: any;
  private userMarker: any = null;
  private lastUserCoords: [number, number] | null = null; // Caché de posición
  private mascotaMarkers: { [id: string]: any } = {}; 
  private routingControl: any = null;

  constructor() { }

  initMap(elementId: string, center: [number, number], zoom: number): any {
    if (this.map) {
      this.destroyMap();
    }

    // 1. Inicializar el mapa físico
    this.map = L.map(elementId, {
      zoomControl: false,
      fadeAnimation: true
    }).setView(center, zoom);

    // 2. Capa de diseño (CartoDB) - Adaptable a modo oscuro
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const style = isDark ? 'dark_all' : 'light_all';
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`, {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // 3. Suscribirse a las mascotas (Reactividad total)
    this.mascotasService.getMascotas().subscribe(mascotas => {
      if (mascotas && Array.isArray(mascotas)) {
        mascotas.forEach((pet: any) => {
          if (pet.lat && pet.lng) {
            this.dibujarOActualizarMascota(pet);
          }
        });
      }
    });
    this.mascotasService.getMascotaSeleccionada().subscribe(pet => {
  if (pet && pet.lat && pet.lng) {
    console.log('🎯 Enfocando mascota seleccionada:', pet.nombre);
    
    // Esperamos un momento a que el mapa esté listo y "volamos" a ella
    setTimeout(() => {
      this.irAMascota(pet.lat, pet.lng);
      // Opcional: Limpiamos la selección para que no se repita el viaje al volver a entrar
      this.mascotasService.limpiarSeleccion();
    }, 800);
  }
});

    // 4. Intentar obtener ubicación inicial
    this.localizacionInicialAutomática();

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 500);

    return this.map;
  }

  // --- LÓGICA DE GPS DEL USUARIO ---

  private async obtenerCoordenadas(altaPrecision: boolean = false): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: altaPrecision,
        timeout: 10000, 
        maximumAge: 0 
      };

      if (!navigator.geolocation) {
        reject({ code: 0, message: "GPS no soportado" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.actualizarMarcadorUsuario(lat, lng);
          resolve([lat, lng]);
        },
        (error) => {
          // Si falla el GPS real, intentamos devolver la última conocida
          if (this.lastUserCoords) {
            resolve(this.lastUserCoords);
          } else {
            reject(error);
          }
        },
        options
      );
    });
  }

  actualizarMarcadorUsuario(lat: number, lng: number) {
    if (!this.map) return;
    
    this.lastUserCoords = [lat, lng]; // Guardar en caché

    const iconoUsuario = L.divIcon({
      className: 'user-icon',
      html: `<div style="width: 14px; height: 14px; background: #000; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    } else {
      this.userMarker = L.marker([lat, lng], { icon: iconoUsuario, zIndexOffset: 1000 }).addTo(this.map);
    }
  }

  private async localizacionInicialAutomática() {
    try {
      await this.obtenerCoordenadas(false);
    } catch (e) {
      console.warn('GPS esperando señal inicial...');
    }
  }

  async centrarEnUsuario() {
    try {
      const coords = await this.obtenerCoordenadas(true);
      this.map.setView(coords, 17, { animate: true });
    } catch (error: any) {
      if (this.lastUserCoords) {
        this.map.setView(this.lastUserCoords, 17, { animate: true });
      } else {
        this.manejarErrorGPS(error);
      }
    }
  }

  // --- NAVEGACIÓN Y RUTAS ---

  async irAMascota(destLat: number, destLng: number) {
  // 1. BLINDAJE: Si no son números válidos, salimos antes de que Leaflet explote
  if (destLat === undefined || destLng === undefined || isNaN(destLat) || isNaN(destLng)) {
    console.error("❌ Error Grave: Coordenadas de destino inválidas", { destLat, destLng });
    return;
  }

  // 2. Mover el mapa (con cuidado)
  try {
    this.map.setView([destLat, destLng], 18, { animate: true });
  } catch (e) {
    console.error("Leaflet no pudo centrar la cámara:", e);
    return;
  }
  
  let userPos = this.lastUserCoords;

  try {
    // Intentamos refrescar la posición del usuario
    userPos = await this.obtenerCoordenadas(false);
  } catch (e) {
    console.log("📍 Usando ubicación de caché para la ruta");
  }

  // 3. Solo trazamos si el usuario también tiene coordenadas válidas
  if (userPos && !isNaN(userPos[0]) && !isNaN(userPos[1])) {
    this.trazarRuta(userPos[0], userPos[1], destLat, destLng);
  } else {
    console.warn("No se pudo trazar ruta: Sin coordenadas válidas del usuario.");
  }
}

  private trazarRuta(slat: number, slng: number, elat: number, elng: number) {
    // 1. Limpiar ruta anterior si existe
    if (this.routingControl) {
      this.map.removeLayer(this.routingControl);
      this.routingControl = null;
    }

    // 2. Consultar servidor de rutas OSRM (OpenStreetMap)
    const url = `https://router.project-osrm.org/route/v1/driving/${slng},${slat};${elng},${elat}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates;
          const latLngs = coordinates.map((coord: any) => [coord[1], coord[0]]);

          this.routingControl = L.polyline(latLngs, {
            color: '#5e30f3', 
            weight: 6,
            opacity: 0.8,
            lineJoin: 'round',
            pane: 'overlayPane'
          }).addTo(this.map);

          this.routingControl.bringToFront();

          const bounds = L.latLngBounds([L.latLng(slat, slng), L.latLng(elat, elng)]);
          this.map.fitBounds(bounds, { padding: [50, 50] });
        }
      })
      .catch(err => console.error('Error al obtener la ruta:', err));
  }

  // --- DIBUJADO DE MASCOTAS ---

  private dibujarOActualizarMascota(pet: any) {
    if (!this.map) return;
    
    const petId = pet._id; 
    const color = (pet.bateria < 20) ? '#ff4444' : '#5e30f3';

    const petIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; border: 3px solid white; border-radius: 50%; width: 35px; height: 35px; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">${pet.nombre[0]}</div>`,
      iconSize: [35, 35],
      iconAnchor: [17, 17]
    });

    const popupContent = `
      <div style="text-align: center; padding: 5px;">
        <b style="font-size: 16px;">${pet.nombre}</b><br>
        <p style="margin: 5px 0; color: ${pet.bateria < 20 ? 'red' : '#666'};">
          Batería: ${pet.bateria}%
        </p>
        <button id="btn-ir-${petId}" style="background: #000; color: #fff; border: none; padding: 10px; border-radius: 8px; width: 100%; font-weight: bold; cursor: pointer;">IR AHORA</button>
      </div>`;

    if (this.mascotaMarkers[petId]) {
      this.mascotaMarkers[petId].setLatLng([pet.lat, pet.lng]);
      this.mascotaMarkers[petId].getPopup().setContent(popupContent);
    } else {
      const nuevoMarcador = L.marker([pet.lat, pet.lng], { icon: petIcon }).addTo(this.map).bindPopup(popupContent);
      
      nuevoMarcador.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`btn-ir-${petId}`);
          if (btn) btn.onclick = () => this.irAMascota(pet.lat, pet.lng);
        }, 100);
      });
      
      this.mascotaMarkers[petId] = nuevoMarcador;
    }
  }

  private manejarErrorGPS(error: any) {
    if (error.code === 1) {
      alert('Por favor, activa el permiso de ubicación en tu navegador.');
    } else {
      console.warn('Error GPS:', error.message);
    }
  }

  destroyMap() {
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
      this.userMarker = null;
      this.mascotaMarkers = {};
      this.routingControl = null;
      this.lastUserCoords = null;
    }
  }
}