import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonItem, 
  IonLabel, IonInput, IonButton, IonIcon, IonSelect, IonSelectOption, 
  AlertController, IonList, LoadingController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, mailOutline, lockClosedOutline, 
  pawOutline, hardwareChipOutline, happyOutline, chevronBackOutline 
} from 'ionicons/icons';

import { Auth } from '../services/auth';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, 
    IonTitle, IonItem, IonLabel, IonInput, IonButton, IonIcon, 
    IonSelect, IonSelectOption, IonList
  ]
})
export class RegistroPage {
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private authService = inject(Auth);

  // Volvemos al modelo simple con ngModel
  nuevoUsuario = {
    nombre: '',
    correo: '',        
    contrasena: '',    
    nombreMascota: '',
    tipoMascota: '',
    idCollar: ''
  };

  constructor() {
    addIcons({ personOutline, mailOutline, lockClosedOutline, pawOutline, hardwareChipOutline, happyOutline, chevronBackOutline });
  }

  irALogin() { this.router.navigate(['/login']); }

  async realizarRegistro() {
    // Validación básica de HTML/TS antes de enviar
    const { nombre, correo, contrasena, } = this.nuevoUsuario;

    if (!nombre || !correo || !contrasena ) {
      this.mostrarAlerta('Atención', 'Todos los campos son obligatorios', true);
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Registrando...' });
    await loading.present();

    this.authService.registrar(this.nuevoUsuario).subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.alertaExito();
      },
      error: async (err) => {
        await loading.dismiss();
        // AQUÍ RECIBIMOS LO QUE EXPRESS DIGA
        // Si Express-Validator encuentra que el correo es inválido, mandará un 400
        let msg = 'Error en el registro';
        if (err.status === 400) {
          msg = err.error.errores ? err.error.errores[0].msg : 'Datos inválidos según el servidor';
        }
        this.mostrarAlerta('Error de Validación', msg, true);
      }
    });
  }

  async alertaExito() {
    const success = await this.alertCtrl.create({
      header: '¡REGISTRO EXITOSO!',
      message: `¡Bienvenido a Atja’Yaa’La!`,
      cssClass: 'atjaya-alert success-special',
      buttons: [{ text: 'COMENZAR', handler: () => this.router.navigate(['/perfil']) }]
    });
    await success.present();
  }

  async mostrarAlerta(header: string, message: string, esError: boolean = false) {
    const alert = await this.alertCtrl.create({
      header, message,
      cssClass: esError ? 'atjaya-alert error' : 'atjaya-alert',
      buttons: ['ENTENDIDO']
    });
    await alert.present();
  }
}