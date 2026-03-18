import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonBackButton, IonList, IonItem, IonLabel, IonIcon, 
  IonToggle, IonSelect, IonSelectOption, IonNote, IonBadge 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  moonOutline, sunnyOutline, navigateOutline, mapOutline, 
  exitOutline, flashOutline, wifiOutline, radioOutline,timerOutline,      // Para el Intervalo de Reporte
  locateOutline, chevronDownOutline    // Para la Geocerca 
} from 'ionicons/icons';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonButtons, IonBackButton, IonList, IonItem, 
    IonLabel, IonIcon, IonToggle, IonSelect, IonSelectOption, 
    IonNote, IonBadge
  ]
})
export class AjustesPage implements OnInit {

  isDarkMode: boolean = false;
  
  // Variables para los ajustes del rastreador
  reportInterval: string = '30';
  geofenceEnabled: boolean = true;
  lowBatteryAlert: boolean = true;

  constructor() {
    // Registramos los iconos que usamos en el HTML
    addIcons({
      moonOutline,
      sunnyOutline,
      navigateOutline,
      mapOutline,
      exitOutline,
      flashOutline,
      wifiOutline,
      radioOutline,timerOutline,chevronDownOutline,locateOutline
    });
  }

  ngOnInit() {
    this.checkCurrentTheme();
    this.loadDeviceSettings();
  }

  /**
   * Verifica el estado actual del modo oscuro para sincronizar el toggle
   */
  checkCurrentTheme() {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      this.isDarkMode = saved === 'true';
    } else {
      this.isDarkMode = document.body.classList.contains('dark');
    }
  }

  /**
   * Cambia el tema y guarda la preferencia
   */
  toggleDarkMode(event: any) {
    this.isDarkMode = event.detail.checked;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  /**
   * Carga configuraciones previas del dispositivo (si las hay)
   */
  loadDeviceSettings() {
    const interval = localStorage.getItem('reportInterval');
    if (interval) this.reportInterval = interval;
    
    // Aquí podrías cargar más datos desde una API o Storage
  }

  /**
   * Ejemplo de función para guardar cambios de GPS
   */
  onIntervalChange(event: any) {
    const newValue = event.detail.value;
    this.reportInterval = newValue;
    localStorage.setItem('reportInterval', newValue);
    console.log('Nuevo intervalo de reporte enviado al collar:', newValue);
    
    // Aquí iría la lógica para enviar el comando por Bluetooth o HTTP al ESP32
  }

  // Función para simular la actualización de la geocerca
  async updateGeofence() {
    console.log('Abriendo mapa para ajustar geocerca...');
    // Aquí podrías navegar a una página de mapa:
    // this.router.navigate(['/geofence-map']);
  }
}