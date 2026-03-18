import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  mailOutline, 
  callOutline, 
  locationOutline, 
  calendarClearOutline, 
  logOutOutline,
  camera,
  ribbonOutline,
  cardOutline,
  helpCircleOutline,
  chevronForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PerfilPage {
  private router = inject(Router);

  constructor() {
    // Registro de todos los iconos para que se visualicen correctamente
    addIcons({ 
      mailOutline, 
      callOutline, 
      locationOutline, 
      calendarClearOutline, 
      logOutOutline,
      camera,
      ribbonOutline,
      cardOutline,
      helpCircleOutline,
      chevronForwardOutline
    });
  }

  logout() {
    // Lógica para cerrar sesión y redirigir
    this.router.navigate(['/login']);
  }
}