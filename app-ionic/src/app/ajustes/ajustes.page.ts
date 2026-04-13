import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonBackButton, 
  IonIcon, 
  IonToggle, 
  IonButton,
  NavController, 
  AlertController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, 
  lockClosedOutline, 
  moon, 
  sunnyOutline, 
  notificationsOutline, 
  helpBuoyOutline, 
  logOutOutline,
  chevronForwardOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonBackButton, 
    IonIcon, 
    IonToggle, 
    IonButton
  ]
})
export class AjustesPage implements OnInit {
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  
  isDarkMode: boolean = false;

  constructor() {
    // Registramos los iconos para poder usarlos por nombre en el HTML
    addIcons({ 
      personOutline, 
      lockClosedOutline, 
      moon, 
      sunnyOutline, 
      notificationsOutline, 
      helpBuoyOutline, 
      logOutOutline,
      chevronForwardOutline 
    });
  }

  ngOnInit() {
    this.checkCurrentTheme();
  }

  checkCurrentTheme() {
    // Verificamos si el body tiene la clase dark activa
    this.isDarkMode = document.body.classList.contains('dark');
  }

  toggleDarkMode(event: any) {
    this.isDarkMode = event.detail.checked;
    document.body.classList.toggle('dark', this.isDarkMode);
    localStorage.setItem('darkMode', this.isDarkMode.toString());
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Salir', 
          role: 'destructive',
          handler: () => {
            localStorage.removeItem('usuario');
            this.navCtrl.navigateRoot('/login'); 
          } 
        }
      ]
    });
    await alert.present();
  }

  irAPerfilUsuario() { console.log('Navegar a perfil'); }
  cambiarPassword() { console.log('Navegar a seguridad'); }
  abrirAyuda() { console.log('Abrir ayuda'); }
}