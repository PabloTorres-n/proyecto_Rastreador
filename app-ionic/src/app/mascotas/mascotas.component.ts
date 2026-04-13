import { Component, OnInit } from '@angular/core';
import { MascotasService } from '../services/mascotas'; 
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Necesario para decimal pipes y ngFor

// 1. Importa todos los componentes de Ionic que estás usando en el HTML
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonContent, IonCard, IonItem, IonAvatar, 
  IonLabel, IonBadge, IonIcon, IonButton, 
  IonCardContent 
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { 
  batteryDeadOutline, 
  batteryChargingOutline, 
  navigateCircle, 
  pawOutline, 
  locationOutline,
  addCircleOutline,paperPlane,personOutline,trailSignOutline

} from 'ionicons/icons';

@Component({
  selector: 'app-mascotas',
  templateUrl: './mascotas.component.html',
  styleUrls: ['./mascotas.component.scss'],
  standalone: true,
  // 2. Agrégalos aquí para que Angular los reconozca
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, 
    IonContent, IonCard, IonItem, IonAvatar, 
    IonLabel, IonBadge, IonIcon, IonButton, 
    IonCardContent,RouterModule,
    RouterModule
  ]
})
export class MascotasComponent implements OnInit {
  mascotas: any[] = [];

  constructor(
    private mascotasService: MascotasService,
    private router: Router
  ) {
    console.log('🏗️ Constructor: El componente se está creando');
    // 3. Registra los iconos
    addIcons({ 
      batteryDeadOutline, 
      batteryChargingOutline, 
      navigateCircle, 
      pawOutline, 
      locationOutline,
      addCircleOutline,
      paperPlane,personOutline,trailSignOutline
    });
  }

ngOnInit() {
  // 1. Primero nos suscribimos para que el HTML reaccione cuando lleguen datos
  this.mascotasService.getMascotas().subscribe(data => {
    this.mascotas = data;
    console.log('📦 Datos recibidos en el HTML:', this.mascotas);
  });

  // 2. AHORA accionamos la petición a MongoDB
  const usuarioRaw = localStorage.getItem('usuario');
  if (usuarioRaw) {
    const user = JSON.parse(usuarioRaw);
    const userId = user.id || user._id;

    if (userId) {
      console.log('📡 Llamando a la API para el usuario:', userId);
      // ESTA LINEA es la que quita el mensaje de "Aún no tienes mascotas"
      this.mascotasService.cargarMascotasDesdeBD(userId).subscribe({
        next: (res) => console.log('✅ Petición exitosa'),
        error: (err) => console.error('❌ Error en la API:', err)
      });
    }
  }
}

 verEnMapa(pet: any) {
  this.router.navigate(['/home'], { 
    queryParams: { petId: pet._id } 
  });
}

irAlPerfil(id: string) {
  console.log('Navegando a la mascota con ID:', id); // Si esto no sale en consola, el botón no está detectando el clic
  this.router.navigate(['/perfil-mascota', id]);
}
}