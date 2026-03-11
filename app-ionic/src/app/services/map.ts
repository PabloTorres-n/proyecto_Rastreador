import { Injectable, inject } from '@angular/core';
import { MascotasService } from './mascotas';
import { io } from 'socket.io-client'; // Importar socket.io

declare var L: any;

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mascotasService = inject(MascotasService);
  private map: any;
  private socket: any;
  private userMarker: any = null;
  private mascotaMarkers: { [id: string]: any } = {}; 
  private routingControl: any = null;
  private lastUserCoords: [number, number] | null = null;

  constructor() {
    // Inicializamos el socket apuntando a tu backend Express
    this.socket = io('http://localhost:3000'); 
  }
  private mascotaEnSeguimiento: string | null = null;
  private isRouting = false;

  initMap(elementId: string, center: [number, number], zoom: number): any {
    if (this.map) this.destroyMap();

    this.map = L.map(elementId, { zoomControl: false }).setView(center, zoom);

    // Diseño Dark Matter (Negro puro para combinar con tu app)
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const mapStyle = isDark ? 'dark_all' : 'light_all';
    
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/${mapStyle}/{z}/{x}/{y}{r}.png`, {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // ESCUCHA EN TIEMPO REAL (WebSockets)
    // Cuando el servidor Express emita un cambio, actualizamos el mapa sin recargar
    this.socket.on('posicion-actualizada', (data: any) => {
      this.actualizarPosicionMascotaRealtime(data);
    });

    // Carga inicial de mascotas desde el servicio existente
    this.mascotasService.getMascotas().subscribe(mascotas => {
      mascotas?.forEach((pet: any) => this.dibujarOActualizarMascota(pet));
    });

    this.localizacionInicialAutomática();
    return this.map;
  }

  // --- EL AVION DE PAPEL NARANJA (UI NUEVA) ---
  private dibujarOActualizarMascota(pet: any) {
  const petId = pet._id;
  const latlng: [number, number] = [pet.lat, pet.lng];

  // 1. Icono dinámico (Sin estilos en línea complejos para evitar errores)
 // En map.ts, dentro del HTML del marcador:
const customIcon = L.divIcon({
  className: 'custom-pet-marker',
  html: `
    <div style="
      background: #ffffff; 
      border: 1px solid #f97316; 
      color: #f97316;
      width: 40px; height: 40px; 
      border-radius: 15px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    ">
      ${pet.nombre[0]}
    </div>`,
  iconSize: [40, 40]
});
  // 2. Contenido del Popup (Clases limpias)
  const popupContent = `
    <div class="pet-popup-card">
      <h3>${pet.nombre}</h3>
      <div class="pet-details">
        <span>🔋 ${pet.bateria}%</span>
       
      </div>
      <button id="btn-ir-${petId}" class="btn-popup-action">
        IR AHORA
      </button>
    </div>
  `;

  if (this.mascotaMarkers[petId]) {
    this.mascotaMarkers[petId].setLatLng(latlng);
    this.mascotaMarkers[petId].getPopup().setContent(popupContent);
  } else {
    const nuevoMarcador = L.marker(latlng, { icon: customIcon })
      .addTo(this.map)
      .bindPopup(popupContent, { 
        className: 'modern-popup-wrapper',
        closeButton: false 
      });

    // 3. EVENTO DEL BOTÓN (Corregido el ID)
    nuevoMarcador.on('popupopen', () => {
      // Usamos el ID correcto: btn-ir-
      const btn = document.getElementById(`btn-ir-${petId}`);
      if (btn) {
        btn.onclick = () => {
          this.irAMascota(pet.lat, pet.lng, petId); 
  this.map.closePopup();
        };
      }
    });

    this.mascotaMarkers[petId] = nuevoMarcador;
  }
}

  // --- LÓGICA DE WEBSOCKET ---
 private actualizarPosicionMascotaRealtime(data: any) {
  const idRecibido = String(data.petId || data._id || '').trim();

  if (this.mascotaMarkers[idRecibido]) {
    const newLatLng: [number, number] = [data.lat, data.lng];
    this.mascotaMarkers[idRecibido].setLatLng(newLatLng);

    // Solo trazamos si: es la mascota seguida, tenemos GPS y NO hay una ruta procesándose
    if (this.mascotaEnSeguimiento === idRecibido && this.lastUserCoords && !this.isRouting) {
      this.trazarRuta(this.lastUserCoords[0], this.lastUserCoords[1], data.lat, data.lng);
    }
  }
}
  // --- GPS USUARIO (PUNTO AZUL) ---
  actualizarMarcadorUsuario(lat: number, lng: number) {
    this.lastUserCoords = [lat, lng];
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `<div style="
        width: 16px; height: 16px; 
        background: #3b82f6; 
        border: 3px solid white; 
        border-radius: 50%;
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
      "></div>`,
      iconSize: [20, 20]
    });

    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    } else {
      this.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
    }
  }

  // --- RUTA OSRM (MANTIENE TU LOGICA PERO CON COLOR NARANJA/VIOLETA) ---
irAMascota(lat: number, lng: number, petId?: string) {
  if (!this.map || !this.lastUserCoords) {
    console.warn("Mapa o GPS no listos para trazar ruta");
    return;
  }

  // IMPORTANTE: Aquí fijamos a quién seguir
  if (petId) {
    this.mascotaEnSeguimiento = petId;
  }

  this.map.flyTo([lat, lng], 17, { animate: true, duration: 2 });
  
  // Trazamos la ruta inicial inmediatamente
  this.trazarRuta(this.lastUserCoords[0], this.lastUserCoords[1], lat, lng);
}

private trazarRuta(slat: number, slng: number, elat: number, elng: number) {
  if (this.routingControl) {
    this.map.removeLayer(this.routingControl);
  }

  const url = `https://router.project-osrm.org/route/v1/foot/${slng},${slat};${elng},${elat}?overview=full&geometries=geojson`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.code === 'Ok' && data.routes.length > 0) {
        const latLngs = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
        
        this.routingControl = L.polyline(latLngs, {
          color: '#FF0000', // ROJO TEMPORAL PARA PRUEBA
          weight: 8,
          opacity: 1,
          pane: 'markerPane' // FORZAMOS que esté al nivel de los marcadores (arriba de todo)
        }).addTo(this.map);
        
        console.log("📍 LÍNEA DIBUJADA EN:", latLngs[0]);
      }
    })
    .catch(err => console.error("❌ ERROR OSRM:", err));
}

  private async localizacionInicialAutomática() {
    try {
      // Intentamos obtener la ubicación actual sin forzar alta precisión al inicio
      const pos: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      this.actualizarMarcadorUsuario(pos.coords.latitude, pos.coords.longitude);
    } catch (e) {
      console.warn('GPS esperando señal inicial o permiso denegado.');
    }
  }
  /**
   * Centra la cámara del mapa en la ubicación actual del usuario
   * con un zoom cercano (nivel 17).
   */
  async centrarEnUsuario() {
    if (!this.map) return;

    try {
      // Si ya tenemos coordenadas en caché, las usamos para que sea instantáneo
      if (this.lastUserCoords) {
        this.map.flyTo(this.lastUserCoords, 17, {
          animate: true,
          duration: 1.5
        });
      } else {
        // Si no hay caché, intentamos obtenerlas una vez más
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        this.map.flyTo(coords, 17, { animate: true });
        this.actualizarMarcadorUsuario(coords[0], coords[1]);
      }
    } catch (e) {
      console.warn('No se pudo centrar en el usuario:', e);
    }
  }

  /**
   * Limpia por completo el mapa y los marcadores para evitar fugas de memoria
   * y errores de "Map container is already initialized".
   */
  destroyMap() {
    if (this.map) {
      this.map.off(); // Quita todos los listeners
      this.map.remove(); // Elimina el objeto del DOM
      this.map = null;
      this.userMarker = null;
      this.mascotaMarkers = {};
      this.routingControl = null;
      this.lastUserCoords = null;
      
      // Cerramos el socket si es necesario
      if (this.socket) {
        this.socket.disconnect();
      }
    }
  }

  // Si no tienes este método para manejar errores de navegación:
  private manejarErrorGPS(error: any) {
    const msg = error.code === 1 ? 'Activa el permiso de ubicación' : 'Error de señal GPS';
    console.warn('📍 GPS:', msg);
  }
}