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
  
  public map: any = null;
  public mascotaMarkers: { [id: string]: any } = {};
  public geocercaCircles: { [id: string]: any } = {};
  public lastUserCoords: [number, number] | null = null;
  
  private userMarker: any = null;
  private rutaGroup: any = null; 
  private mascotaEnSeguimiento: string | null = null;
  private isRouting = false;
  private mapReady = false;

  constructor() {}

  initMap(elementId: string, center: [number, number], zoom: number): any {
    this.mapReady = false;

    if (this.map) {
      this.map.off(); 
      this.map.remove();
      this.map = null;
    }

    this.mascotaMarkers = {};
    this.geocercaCircles = {};
    this.userMarker = null;

    this.map = L.map(elementId, { 
      zoomControl: false
    });

    this.map.whenReady(() => {
      this.mapReady = true;
      console.log('🌍 Mapa listo');
      
      this.mascotasService.getMascotas().subscribe((mascotas: any[]) => {
        mascotas?.forEach(pet => this.dibujarOActualizarMascota(pet));
      });
    });

    this.map.setView(center, zoom);

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/${isDark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`, {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    this.map.createPane('rutaPane');
    this.map.getPane('rutaPane').style.zIndex = '450';
    this.rutaGroup = L.featureGroup().addTo(this.map);

    this.localizacionInicialAutomática();

    return this.map;
  }

  private dibujarOActualizarMascota(pet: any) {
    if (!this.map || !this.mapReady) return;

    const latMascota = parseFloat(pet.lat);
    const lngMascota = parseFloat(pet.lng);

    if (isNaN(latMascota) || isNaN(lngMascota) || latMascota === 0) return;

    const petId = String(pet._id);
    const petLatLng: L.LatLngExpression = [latMascota, lngMascota];

    try {
        if (this.mascotaMarkers[petId]) {
            this.mascotaMarkers[petId].setLatLng(petLatLng);
        } else {
            const avatarHtml = pet.foto_url 
                ? `<img src="${pet.foto_url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                : `<span>${pet.nombre[0].toUpperCase()}</span>`;

            const customIcon = L.divIcon({
                className: 'custom-pet-marker',
                html: `<div style="background: #231B6B; border: 3px solid white; color: #f97316; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">${avatarHtml}</div>`,
                iconSize: [45, 45],
                iconAnchor: [22, 22]
            });

            this.mascotaMarkers[petId] = L.marker(petLatLng, { 
                icon: customIcon,
                zIndexOffset: 1000 
            }).addTo(this.map);

            this.mascotaMarkers[petId].on('click', () => {
                this.mascotasService.setMascotaSeleccionada(pet);
            });
        }

        const latCentro = parseFloat(pet.geoLat);
        const lngCentro = parseFloat(pet.geoLng);
        const radio = Number(pet.geoRadio);
        const estaActiva = pet.geoActive === true || String(pet.geoActive) === 'true';

        if (estaActiva && radio > 0 && !isNaN(latCentro)) {
            const centroLatLng: L.LatLngExpression = [latCentro, lngCentro];
            if (this.geocercaCircles[petId]) {
                this.geocercaCircles[petId].setLatLng(centroLatLng).setRadius(radio);
            } else {
                this.geocercaCircles[petId] = L.circle(centroLatLng, {
                    radius: radio,
                    color: '#f97316',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '5, 10',
                    interactive: false
                }).addTo(this.map);
            }
        } else if (this.geocercaCircles[petId]) {
          this.map.removeLayer(this.geocercaCircles[petId]);
          delete this.geocercaCircles[petId];
        }
    } catch (e) {
        console.error("Error en dibujo:", e);
    }
  }

  private trazarRuta(slat: number, slng: number, elat: number, elng: number) {
    if (!slat || !slng || !this.map || !this.rutaGroup) return;

    // LIMPIEZA TOTAL DE CAPAS PREVIAS
    this.rutaGroup.eachLayer((layer: any) => this.map.removeLayer(layer));
    this.rutaGroup.clearLayers();

    // 1. LÍNEA RECTA DE RESPALDO (Sin relleno para evitar el bug)
    const lineaRespaldo = L.polyline([[slat, slng], [elat, elng]], {
      color: '#f97316',
      weight: 4,
      opacity: 0.5,
      dashArray: '10, 10',
      fill: false, // <--- EVITA EL ÁREA PINTADA
      pane: 'rutaPane',
      interactive: false
    }).addTo(this.rutaGroup);

    const url = `https://router.project-osrm.org/route/v1/car/${slng},${slat};${elng},${elat}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes?.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          
          this.rutaGroup.clearLayers();
          const polylineReal = L.polyline(coords, {
            color: '#f97316',
            weight: 6,
            opacity: 0.9,
            fill: false, // <--- EVITA EL ÁREA PINTADA
            pane: 'rutaPane',
            interactive: false
          }).addTo(this.rutaGroup);

          this.map.fitBounds(polylineReal.getBounds(), { padding: [50, 50], maxZoom: 16 });
        }
      })
      .catch(err => console.warn("OSRM error:", err))
      .finally(() => this.isRouting = false);
  }

  async irAMascota(lat: number, lng: number, petId?: string) {
    if (!this.map) return;
    
    if (this.rutaGroup) this.rutaGroup.clearLayers();
    this.map.invalidateSize();
    if (petId) this.mascotaEnSeguimiento = petId;

    this.map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });

    // ESPERAR A QUE EL MAPA TERMINE DE MOVERSE PARA TRAZAR
    this.map.once('moveend', () => {
      if (this.lastUserCoords) {
        this.trazarRuta(this.lastUserCoords[0], this.lastUserCoords[1], lat, lng);
      }
    });
  }

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
      console.log("GPS offline");
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
      this.geocercaCircles = {};
    }
  }
}