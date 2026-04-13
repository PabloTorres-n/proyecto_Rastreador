import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';


import { addIcons } from 'ionicons';
import { Cliente } from '../services/cliente';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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
  chevronForwardOutline,hardwareChipOutline
} from 'ionicons/icons';

// ... tus otros imports
import { HttpClient } from '@angular/common/http'; // Asegúrate de que esté aquí

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PerfilPage {
  private router = inject(Router);
  private clienteService = inject(Cliente);
  private http = inject(HttpClient); // <--- TE FALTABA ESTA INYECCIÓN

  usuario: any = null;

  constructor() {
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
      chevronForwardOutline,
      hardwareChipOutline
    });
  }

  ngOnInit() {
    this.obtenerDatos();
  }

  ionViewWillEnter() {
    this.obtenerDatos();
  }

  obtenerDatos() {
    const sesion = localStorage.getItem('usuario');
    if (sesion) {
      const { id } = JSON.parse(sesion);
      this.clienteService.getPerfil(id).subscribe({
        next: (res) => {
          this.usuario = res;
        },
        error: (err) => console.error('Error al obtener perfil', err)
      });
    }
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }

  irAMisCollares() {
    this.router.navigate(['/mis-collares']);
  }

  async cambiarFoto() {

    if (!this.usuario) {
    console.error("Espera a que carguen los datos del usuario");
    return;
  }
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Foto de Perfil',
        promptLabelPhoto: 'Elegir de la galería',
        promptLabelPicture: 'Tomar foto'
      });

      if (image.webPath) {
        // 1. Vista previa
        this.usuario.foto_url = image.webPath;

        // 2. Preparar archivo
        const response = await fetch(image.webPath);
        const blob = await response.blob();

        const formData = new FormData();
        // IMPORTANTE: El nombre 'imagen' debe coincidir con upload.single('imagen') en tu Backend
        formData.append('foto', blob, `perfil_${this.usuario._id}.jpg`);

        // 3. Enviar (Corregida la comilla y el paréntesis)
        this.http.post(`https://raestreadorfijo.vercel.app/api/clientes/${this.usuario._id}/foto`, formData)
          .subscribe({
            next: (res: any) => {
              if (res.ok) {
                console.log('Foto guardada:', res.foto_url);
                this.usuario.foto_url = res.foto_url;
              }
            },
            error: (err) => console.error('Error al subir imagen', err)
          });
      }
    } catch (error) {
      console.log('El usuario canceló la cámara o hubo un error', error);
    }
    
  }
}