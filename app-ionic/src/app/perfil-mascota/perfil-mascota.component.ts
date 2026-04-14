import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MascotasService } from '../services/mascotas'; 
import { ModalController } from '@ionic/angular/standalone'; // Importa el controlador
import { AjustesPage} from "../ajustes/ajustes.page";
import { inject } from '@angular/core'; // Añade inject si usas Angular moderno
import { Geolocation } from '@capacitor/geolocation';
import { HttpClient } from '@angular/common/http'; // Asegúrate de que esté aquí
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
// IMPORTANTE: Separamos los componentes de los controladores
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonAvatar, IonBadge, IonGrid, IonRow, IonCol, 
  IonCard, IonCardContent, IonList, IonListHeader, IonItem, 
  IonIcon, IonLabel, IonButton, IonRefresher, IonRefresherContent,
  IonSpinner, IonModal, 
  IonToggle, 
  IonSelect, 
  IonSelectOption
} from '@ionic/angular/standalone';

import { ToastController, AlertController,LoadingController } from '@ionic/angular'; // Controladores van aquí

import { addIcons } from 'ionicons';
import { 
  settingsOutline, batteryDead, batteryCharging, 
  location, pawOutline, timeOutline, navigateCircleOutline, flash, 
  chevronForwardOutline, flashOff, trailSignOutline,
  qrCodeOutline, hardwareChipOutline, thermometerOutline,
  chevronDownCircleOutline, cloudOfflineOutline, navigateOutline, 
  checkmarkCircle,
  // --- ESTOS SON LOS QUE TE FALTAN PARA EL MODAL ---
  alertCircle, 
  timerOutline, 
  locateOutline, 
  camera,
  radioButtonOffOutline,pinOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-perfil-mascota',
  templateUrl: './perfil-mascota.component.html',
  styleUrls: ['./perfil-mascota.component.scss'],
  standalone: true,
 imports: [
    CommonModule, 
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonContent, IonAvatar, IonBadge, IonGrid, IonRow, IonCol, 
    IonCard, IonCardContent, IonList, IonListHeader, IonItem, 
    IonIcon, IonLabel, IonButton, IonRefresher, IonRefresherContent,
    IonSpinner, IonModal, 
    IonToggle, 
    IonSelect, 
    IonSelectOption,
    // Quité los duplicados de IonList e IonListHeader que tenías aquí
  ]
})
export class PerfilMascotaComponent implements OnInit, OnDestroy {
  mascota: any = null;
  estadoActual: string = 'desconectado'; // Variable para el HTML
  private checkInterval: any; // Timer para el estado
  private modalCtrl = inject(ModalController);
  constructor(
    private route: ActivatedRoute,
    private mascotasService: MascotasService,
    private toastCtrl: ToastController, 
    private loadingController: LoadingController,
    private alertCtrl: AlertController, 
    private router: Router , 
    private http:HttpClient
  ) {
    addIcons({ 
      flash, flashOff, batteryDead, batteryCharging, 
      timeOutline, location, chevronForwardOutline,
      trailSignOutline, qrCodeOutline, hardwareChipOutline, 
      thermometerOutline, chevronDownCircleOutline,
      cloudOfflineOutline, navigateOutline, checkmarkCircle,'alert-circle': alertCircle,
      'timer-outline': timerOutline,
      'locate-outline': locateOutline,
      'radio-button-off-outline': radioButtonOffOutline,'settings-outline': settingsOutline,'pin-outline': pinOutline,camera
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatos(id);

      // 🕒 Reloj de estado: Revisa cada 30 seg si el collar se perdió
      this.checkInterval = setInterval(() => {
        this.actualizarEstadoLocal();
      }, 30000);
    }
  }

  ngOnDestroy() {
    // 🗑️ Limpieza: Detener el reloj cuando el usuario sale de la página
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  cargarDatos(id: string, event?: any) {
    this.mascotasService.getMascotaPorId(id).subscribe({
      next: (data) => {
        this.mascota = data;
        this.actualizarEstadoLocal();
        
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        if (event) event.target.complete();
      }
    });
  }

  // --- LÓGICA DE ESTADO OPTIMIZADA ---
  actualizarEstadoLocal() {
    this.estadoActual = this.obtenerEstadoSenal();
  }

  obtenerEstadoSenal(): string {
    if (!this.mascota?.ultimaConexion) return 'desconectado';

    const ahora = new Date().getTime();
    const fechaConexion = new Date(this.mascota.ultimaConexion).getTime();
    
    // Si no hay fecha GPS, lo tratamos como 0 para forzar el estado "sin_gps"
    const fechaGPS = this.mascota.ultimaActualizacion 
      ? new Date(this.mascota.ultimaActualizacion).getTime() 
      : 0;

    const intervaloConfigurado = this.mascota.intervalo || 15000;
    const margenTolerancia = intervaloConfigurado * 2.2; // Tolerancia dinámica

    // 1. Capa Física: ¿Hay internet/comunicación?
    if ((ahora - fechaConexion) > margenTolerancia) {
      return 'desconectado';
    }

    // 2. Capa GPS: ¿El collar habla pero no sabe dónde está?
    // Entra si nunca ha tenido GPS (0) o si el GPS es más viejo de 90 seg que la conexión
    if (fechaGPS === 0 || (fechaConexion - fechaGPS) > 90000) {
      return 'sin_gps';
    }

    // 3. Capa Todo OK
    return 'en_vivo';
  }

  doRefresh(event: any) {
    if (this.mascota?._id) {
      this.cargarDatos(this.mascota._id, event);
    } else {
      event.target.complete();
    }
  }

  // --- ACCIONES ---
  irAHistorial() {
    if (this.mascota?._id) {
      this.router.navigate(['/historial', this.mascota._id]);
    }
  }

  verEnMapa(pet: any) {
    this.router.navigate(['/home'], { queryParams: { petId: pet._id } });
  }

  async abrirScannerVinculacion(petId: string) {
  try {
    const res: any = await this.mascotasService.escanearYVincular(petId);

    // Si el backend responde 200 pero con error interno (res.ok === false)
    if (res && res.ok === false) {
      this.mostrarErrorAlert(res.msg || "Error en la vinculación");
      return; // Detenemos la ejecución aquí
    }

    // Si todo salió bien (res.ok === true)
    if (res && res.ok) {
      this.mostrarToast(res.msg || "✅ ¡Collar vinculado exitosamente!");
      this.cargarDatos(petId);
    }

  } catch (error: any) {
    // Esto solo se ejecuta si el servidor está caído o mandó un error 400, 500, etc.
    this.manejarErrorVinculacion(error);
  }
}

private manejarErrorVinculacion(error: any) {
  // --- SUPER ALERT DE DIAGNÓSTICO ---
  // Esto nos dirá: ¿Es un error de código? ¿De red? ¿De base de datos?
  const diagnosticInfo = {
    status: error.status,
    statusText: error.statusText,
    url: error.url,
    message: error.message,
    errorBody: error.error // Aquí suele venir el E11000 de Mongo
  };


  // ----------------------------------

  // 1. Prioridad Máxima: Respuesta del Backend (Vercel)
  let mensajeServidor = error.error?.msg || error.error?.message || error.msg;

  if (mensajeServidor) {
    this.mostrarErrorAlert("Servidor dice: " + mensajeServidor);
    return;
  }

  // 2. Errores de Conectividad (El famoso Status 0)
  if (error.status === 0) {
    this.mostrarErrorAlert("Error de conexión: El celular no llega al servidor. Revisa HTTPS, CORS o Internet.");
    return;
  }

  // 3. Errores de Capacitor / Hardware
  const errorMsg = (error.message || "").toLowerCase();
  if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
    this.mostrarErrorAlert("Error de Permisos: Ve a Ajustes del celular y permite la cámara a la App.");
    return;
  }
  
  if (errorMsg.includes('canceled') || errorMsg.includes('user cancelled')) {
    return; 
  }

  // 4. Errores de Base de Datos crudos (Si el backend no los filtró)
  if (JSON.stringify(error).includes("E11000")) {
    this.mostrarErrorAlert("Error de Duplicado: El collar o la mascota ya tienen un vínculo activo.");
    return;
  }

  // 5. Genérico final
  this.mostrarErrorAlert("Error inesperado. Status: " + error.status);
}

  async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color: 'success'
    });
    await toast.present();
  }

  async mostrarErrorAlert(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK'],
      mode: 'ios'
    });
    await alert.present();
  }



actualizarConfiguracion(cambios: any) {
  if (!this.mascota?._id) return;

  // 1. Cambio visual inmediato (Optimista)
  const respaldo = { ...this.mascota };
  this.mascota = { ...this.mascota, ...cambios };

  // 2. Guardar en el servidor
  this.mascotasService.actualizarAjustes(this.mascota._id, cambios).subscribe({
    next: (res) => {
      console.log('✅ Servidor actualizado:', res);
      this.mostrarToast('Configuración guardada');
    },
    error: (err) => {
      console.error('❌ Error:', err);
      this.mascota = respaldo; // Si falla, volvemos atrás
      this.mostrarToast('Error al guardar');
    }
  });
}

async fijarPuntoSeguro() {
  const loading = await this.loadingController.create({
    message: 'Obteniendo ubicación precisa...',
    spinner: 'crescent'
  });
  await loading.present();

  try {
    // 1. Obtenemos la posición actual del celular
    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true // Importante para que el radio de 50m sea real
    });

    const nuevasCoords = {
      geoLat: coordinates.coords.latitude,
      geoLng: coordinates.coords.longitude,
      geoActive: true // La activamos automáticamente al fijar el punto
    };

    // 2. Usamos tu función existente para guardar en el servidor
    this.actualizarConfiguracion(nuevasCoords);
    
    await loading.dismiss();
    this.mostrarToast('✅ Punto seguro fijado en tu ubicación actual');

  } catch (error) {
    await loading.dismiss();
    this.mostrarErrorAlert('No se pudo obtener la ubicación. Revisa los permisos de GPS.');
    console.error('Error obteniendo ubicación:', error);
  }
}

toggleBuzzer() {
  // Si está apagado, lo ponemos en 'find'. Si está en 'find', lo ponemos en 'off'.
  const nuevoEstado = this.mascota.buzzer === 'find' ? 'off' : 'find';
  
  // Llamamos a tu función de actualización que ya creamos
  this.actualizarConfiguracion({ buzzer: nuevoEstado });
}
// Función auxiliar para el feedback
async confirmarDesvinculacion() {
  const alert = await this.alertCtrl.create({
    header: '¿Desvincular collar?',
    subHeader: 'Esta acción liberará el dispositivo',
    message: 'Podrás vincular este collar a otra mascota después.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Sí, Desvincular',
        role: 'destructive',
        handler: () => {
          // 1. Cerramos el alert manualmente
          alert.dismiss();
          // 2. Ejecutamos la función
          this.ejecutarDesvinculacion();
          // 3. Retornamos false para que el dismiss manual sea el que mande
          return false;
        }
      }
    ]
  });
  await alert.present();
}

async ejecutarDesvinculacion() {
  const loading = await this.loadingController.create({
    message: 'Liberando...',
    duration: 5000 // Seguridad: si algo falla, se quita solo a los 5s
  });
  await loading.present();

  this.mascotasService.desvincularCollar(this.mascota._id).subscribe({
    next: async (res: any) => {
      await loading.dismiss(); // Cerramos primero
      this.mascota.collarId = ""; 
      this.mostrarToast('✅ Desvinculado');
    },
    error: async (err) => {
      await loading.dismiss(); // Cerramos antes de mostrar el error
      alert("Error de red: " + err.status);
    }
  });
}

async cambiarFotoMascota() {
  if (!this.mascota?._id) return;

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
      // 1. Previsualización
      this.mascota.foto_url = image.webPath;

      // 2. Preparar el envío
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const formData = new FormData();
      
      // Ajusta el nombre del campo según tu Multer (ej: 'imagen')
      formData.append('foto', blob, `mascota_${this.mascota._id}.jpg`);

      // 3. Subir al endpoint de mascotas
      this.http.post(`https://raestreadorfijo.vercel.app/api/mascotas/${this.mascota._id}/foto`, formData)
        .subscribe({
          next: (res: any) => {
            if (res.ok) {
              this.mascota.foto_url = res.foto_url;
              console.log('Foto de la mascota actualizada');
            }
          },
          error: (err) => console.error('Error al subir foto de mascota', err)
        });
    }
  } catch (error) {
    console.log('Cámara cancelada');
  }
}

}