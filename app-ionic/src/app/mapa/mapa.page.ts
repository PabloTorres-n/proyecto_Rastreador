import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonBackButton, IonFab, IonFabButton, IonIcon, IonBadge, 
  IonLabel, IonGrid, IonRow, IonCol 
} from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { addIcons } from 'ionicons';
import { 
  locateOutline, pawOutline, batteryChargingOutline, 
  wifiOutline, refreshOutline 
} from 'ionicons/icons';

/**
 * CAMBIO PARA CORDOVA:
 * Importamos el sensor de Geolocalización.
 */
import { Geolocation } from '@awesome-cordova-plugins/geolocation/ngx';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonBackButton, IonFab, IonFabButton, 
    IonIcon, IonBadge, IonLabel, IonGrid, IonRow, IonCol, CommonModule
  ]
})
export class MapaPage implements OnInit, OnDestroy, AfterViewInit {
  map!: L.Map;
  marker!: L.Marker;
  polyline!: L.Polyline;
  historialCoordenadas: L.LatLngExpression[] = [];
  intervalo: any;

  public mascotaStatus = {
    nombre: 'Solovino',
    bateria: 85,
    senal: 'Fuerte',
    estado: 'En Movimiento',
    ultimaConexion: 'En vivo'
  };

  /**
   * CAMBIO PARA CORDOVA:
   * Inyectamos el sensor en el constructor.
   */
  constructor(private geolocation: Geolocation) {
    addIcons({ 
      locateOutline, pawOutline, batteryChargingOutline, 
      wifiOutline, refreshOutline 
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.inicializarMapa();
    }, 800);
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  inicializarMapa() {
    // Ubicación inicial (Guadalajara)
    const inicio: L.LatLngExpression = [20.6668, -103.3918];
    this.map = L.map('mapIdFull').setView(inicio, 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: 'Atja’Yaa’La GPS'
    }).addTo(this.map);

    const logoIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class='marker-pin'><img src='assets/logoO.png'></div>`,
      iconSize: [50, 50],
      iconAnchor: [25, 50]
    });

    this.marker = L.marker(inicio, { icon: logoIcon }).addTo(this.map);

    this.polyline = L.polyline([], { 
      color: '#F38430', 
      weight: 5, 
      opacity: 0.7 
    }).addTo(this.map);

    /**
     * CAMBIO PARA CORDOVA:
     * En lugar de simulación matemática, usamos datos reales.
     */
    this.iniciarRastreoReal();
  }

  iniciarRastreoReal() {
    // Consultamos el GPS cada 5 segundos
    this.intervalo = setInterval(() => {
      this.geolocation.getCurrentPosition().then((resp) => {
        const nuevaPos: L.LatLngExpression = [resp.coords.latitude, resp.coords.longitude];
        
        // Actualizamos el marcador y la línea naranja con la posición real
        this.marker.setLatLng(nuevaPos);
        this.historialCoordenadas.push(nuevaPos);
        this.polyline.setLatLngs(this.historialCoordenadas);

        console.log('Posición real de Atja’Yaa’La capturada.');
      }).catch((error) => {
        console.error('Error al obtener coordenadas con Cordova:', error);
      });
    }, 5000);
  }

  reCentrar() {
    if (this.map && this.marker) {
      this.map.setView(this.marker.getLatLng(), 17);
    }
  }
}