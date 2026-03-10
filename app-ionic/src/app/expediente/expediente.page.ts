import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonBackButton, IonList, IonItem, IonLabel, IonIcon, 
  IonGrid, IonRow, IonCol, IonButton, IonBadge, IonAvatar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  pawOutline, medicalOutline, calendarOutline, 
  informationCircleOutline, shieldCheckmarkOutline,
  chevronBackOutline, hardwareChipOutline, alertCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-expediente',
  templateUrl: './expediente.page.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, 
    IonTitle, IonButtons, IonBackButton, IonList, IonItem, IonLabel, 
    IonIcon, IonGrid, IonRow, IonCol, IonButton, IonBadge, IonAvatar
  ]
})
export class ExpedientePage implements OnInit {
  // Yo inyecto el Router aquí para que el botón de "Regresar" sepa a dónde ir
  public router = inject(Router);

  // Aquí guardo los datos de tu mascota. Incluyo 'foto' para que el HTML la encuentre sin errores
  datosMascota = {
    nombre: 'Solovino',
    especie: 'Perro',
    raza: 'Mestizo',
    edad: '2 años',
    idCollar: 'ATJ-100',
    foto: 'https://placedog.net/500' 
  };

  // Esta es la lista de vacunas que mostraré en la tabla de abajo
  historialVacunas = [
    { nombre: 'Rabia', fecha: '15/01/2026', estatus: 'Aplicada' },
    { nombre: 'Parvovirus', fecha: 'Pendiente', estatus: 'Próxima' },
    { nombre: 'Desparasitación', fecha: '01/02/2026', estatus: 'Aplicada' }
  ];

  constructor() {
    // Yo registro aquí todos los iconos para que Ionic los pueda dibujar en la pantalla
    addIcons({ 
      pawOutline, medicalOutline, calendarOutline, 
      informationCircleOutline, shieldCheckmarkOutline,
      chevronBackOutline, hardwareChipOutline, alertCircleOutline
    });
  }

  ngOnInit() {}

  // Con esta función yo decido si el color de la etiqueta es verde o naranja según el estatus
  getBadgeColor(estatus: string) {
    return estatus === 'Aplicada' ? 'success' : 'warning';
  }

  // Esta función es la que ejecuto cuando tocas el botón de volver al perfil
  irAPerfil() {
    this.router.navigate(['/perfil']);
  }
}