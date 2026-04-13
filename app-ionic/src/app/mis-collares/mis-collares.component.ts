import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, 
  IonContent, IonList, IonCard, IonCardContent, IonBadge, 
  IonIcon, IonButton, IonSpinner 
} from '@ionic/angular/standalone';
// Importamos los controladores para el Alert y el Toast
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { Cliente } from '../services/cliente';
import { addIcons } from 'ionicons';
import { 
  hardwareChip, batteryCharging, wifi, timeOutline, 
  checkmarkCircle, paw, codeWorking, settingsOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-mis-collares',
  templateUrl: './mis-collares.component.html',
  styleUrls: ['./mis-collares.component.scss'],
  standalone: true,
  imports: [
    CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, 
    IonBackButton, IonContent, IonList, IonCard, IonCardContent, 
    IonBadge, IonIcon, IonButton, IonSpinner
  ]
})
export class MisCollaresComponent implements OnInit {
  private mascotasService = inject(Cliente);
  // Inyectamos los controladores
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  
  public dispositivos: any[] = [];
  public cargando = true;

  constructor() {
    addIcons({ 
      batteryCharging, wifi, timeOutline, hardwareChip, 
      checkmarkCircle, paw, codeWorking, settingsOutline 
    });
  }

  ngOnInit() {
    this.cargarDispositivos();
  }

  cargarDispositivos() {
    this.cargando = true;
    const userRaw = localStorage.getItem('usuario');
    
    if (!userRaw) {
      this.cargando = false;
      return;
    }

    try {
      const usuario = JSON.parse(userRaw);
      const idUsuario = usuario._id || usuario.id;

      this.mascotasService.getMisCollares(idUsuario).subscribe({
        next: (res:any) => {
          if (res.ok) {
            this.dispositivos = res.collares;
          }
          this.cargando = false;
        },
        error: (err) => {
          this.cargando = false;
        }
      });
    } catch (e) {
      this.cargando = false;
    }
  }

  // --- NUEVA FUNCIÓN PARA EL APODO ---
  async abrirAjustesCollar(collar: any) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Dispositivo',
      subHeader: `ID: ${collar.collarId}`,
      inputs: [
        {
          name: 'nuevoApodo',
          type: 'text',
          placeholder: 'Nombre del collar (Ej: Principal)',
          value: collar.apodo || ''
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            this.actualizarApodo(collar._id, data.nuevoApodo);
          }
        }
      ]
    });

    await alert.present();
  }

  actualizarApodo(idCollar: string, nuevoApodo: string) {
    if (!nuevoApodo.trim()) return;

    // Llamamos al servicio (asegúrate de tener este método en tu servicio Cliente)
    this.mascotasService.actualizarApodoCollar(idCollar, nuevoApodo).subscribe({
      next: async (res: any) => {
        if (res.ok) {
          // Actualización optimista en la lista local
          const index = this.dispositivos.findIndex(c => c._id === idCollar);
          if (index !== -1) {
            this.dispositivos[index].apodo = nuevoApodo;
          }

          const toast = await this.toastCtrl.create({
            message: '✅ Apodo actualizado correctamente',
            duration: 2000,
            color: 'success',
            position: 'bottom'
          });
          toast.present();
        }
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({
          message: '❌ Error al actualizar',
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      }
    });
  }

  getBateriaColor(nivel: number): string {
    if (nivel > 60) return '#2dd36f';
    if (nivel > 20) return '#ffce00';
    return '#eb445a';
  }

  formatFecha(fecha: any) {
    if (!fecha) return 'Sin conexión';
    const d = new Date(fecha);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}