import { Component, OnInit } from '@angular/core'; // <--- Importamos OnInit
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonBackButton, IonList, IonListHeader, IonItem, IonIcon, 
  IonLabel, IonNote, IonToggle 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  radioOutline, flashOutline, notificationsOutline, mapOutline, moonOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonBackButton, IonList, IonListHeader, IonItem, 
    IonIcon, IonLabel, IonNote, IonToggle
  ]
})
export class AjustesPage implements OnInit { // <--- Agregamos implements OnInit

  // Esta variable controlará si el switch aparece prendido o apagado al cargar
  isDarkMode: boolean = false; 

  constructor() {
    addIcons({ 
      radioOutline, 
      flashOutline, 
      notificationsOutline, 
      mapOutline,
      moonOutline 
    });
  }

  // Se ejecuta al entrar a la pantalla
  ngOnInit() {
    // Revisamos si el body ya tiene la clase 'dark' para prender el switch
    this.isDarkMode = document.body.classList.contains('dark');
  }

  toggleDarkMode(event: any) {
    const active = event.detail.checked;
    
    // Aplicamos el cambio visual
    document.body.classList.toggle('dark', active);

    // GUARDAMOS la preferencia en la memoria del teléfono
    localStorage.setItem('darkMode', active ? 'true' : 'false');
  }
}