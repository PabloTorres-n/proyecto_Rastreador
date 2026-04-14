import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppComponent } from '../app.component'; // Ajusta la ruta
import { 
  IonContent, IonItem, IonInput, IonButton, IonIcon, IonText, 
  AlertController, LoadingController 
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

// ICONOS
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline } from 'ionicons/icons';

// SERVICIO
import { Auth } from '../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonItem, IonInput, IonButton, IonIcon, IonText, 
    CommonModule, FormsModule
  ]
})
export class LoginPage {
  // Usamos inject para las herramientas de Ionic
  private router = inject(Router);
  private authService = inject(Auth);
  private alertCtrl = inject(AlertController);
 
  private loadingCtrl = inject(LoadingController);

  // Variables vinculadas al HTML por [(ngModel)]
  email = '';
  password = '';

  constructor( private appComponent: AppComponent) {
    // Registro de iconos para que se vean en el HTML
    addIcons({ 
      'mail-outline': mailOutline, 
      'lock-closed-outline': lockClosedOutline 
    });
  }

  async entrar() {
    // 1. Validar que no estén vacíos
    if (!this.email || !this.password) {
      this.mostrarAlerta('Por favor, ingresa correo y contraseña.');
      return;
    }

    // 2. Mostrar indicador de carga
    const loading = await this.loadingCtrl.create({
      message: 'Verificando...',
      spinner: 'crescent'
    });
    await loading.present();

    // 3. Llamar al servicio (Asegúrate de que el método en el servicio reciba estos nombres)
  
    const datosParaElBack = { 
    correo: this.email,      // Mandamos el valor de 'email' con la etiqueta 'correo'
    contrasena: this.password // Mandamos el valor de 'password' con la etiqueta 'contrasena'
  };

    this.authService.login(datosParaElBack).subscribe({
      next: (res: any) => {
        loading.dismiss();
        console.log('Login exitoso', res);
        this.appComponent.setupNotificationsAfterLogin();
        // El interceptor y el tap ya se encargan del token
        this.router.navigate(['/home']);
      },
      error: (err) => {
        loading.dismiss();
        console.error('Error en login', err);
        this.mostrarAlerta(err.error?.msg || 'Error de conexión con el servidor');
      }
    });
  }

  irARegistro() {
    this.router.navigate(['/registro']);
  }

  // Función auxiliar para mensajes de error
  async mostrarAlerta(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: 'Atención',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }
}