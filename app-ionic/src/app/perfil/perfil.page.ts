import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonIcon, IonList, IonItem, IonLabel, IonListHeader, IonGrid, 
  IonRow, IonCol, IonInput, AlertController, ModalController, IonBadge, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  repeatOutline, storefrontOutline, hardwareChipOutline, warningOutline, 
  peopleOutline, statsChartOutline, pawOutline, mapOutline, cardOutline, 
  logOutOutline, chevronForwardOutline, batteryChargingOutline, medicalOutline,
  pulseOutline, serverOutline, trashOutline, addCircleOutline, createOutline,
  personAddOutline, saveOutline
} from 'ionicons/icons';

// =======================================================================
// 1️⃣ VENTANA: MONITOR DE DISPOSITIVOS (HEALTH CHECK ESP32)
// =======================================================================
@Component({
  selector: 'app-dispositivos-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonIcon, IonBadge, IonListHeader, CommonModule],
  template: `
    <ion-header><ion-toolbar color="primary"><ion-title>Monitor ESP32</ion-title><ion-buttons slot="end"><ion-button (click)="cerrar()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content style="--background: #f4f7fa;">
      <ion-list style="margin: 15px; border-radius: 15px;">
        <ion-list-header>ESTADO DE HARDWARE</ion-list-header>
        <ion-item *ngFor="let esp of equipos">
          <ion-icon [name]="esp.bateria > 20 ? 'battery-charging-outline' : 'warning-outline'" [color]="esp.bateria > 20 ? 'success' : 'danger'" slot="start"></ion-icon>
          <ion-label><h2>ID: {{ esp.mac }}</h2><p>Señal GPS: {{ esp.gps }}</p></ion-label>
          <ion-badge [color]="esp.status === 'Online' ? 'success' : 'medium'" slot="end">{{ esp.status }} - {{ esp.bateria }}%</ion-badge>
        </ion-item>
      </ion-list>
    </ion-content>
  `
})
export class DispositivosModalComponent {
  private modalCtrl = inject(ModalController);
  equipos = [
    { mac: 'ESP-32-A1B2', status: 'Online', bateria: 85, gps: 'Fuerte' },
    { mac: 'ESP-32-X9Y8', status: 'Offline', bateria: 5, gps: 'Sin Señal' }
  ];
  cerrar() { this.modalCtrl.dismiss(); }
}

// =======================================================================
// 2️⃣ VENTANA: GESTIÓN DE USUARIOS (CRUD COMPLETO)
// =======================================================================
@Component({
  selector: 'app-usuarios-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonIcon, IonSelect, IonSelectOption, IonBadge, IonInput, IonGrid, IonRow, IonCol, FormsModule, CommonModule],
  template: `
    <ion-header><ion-toolbar color="primary"><ion-title>Gestión de Usuarios</ion-title><ion-buttons slot="end"><ion-button (click)="cerrar()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content style="--background: #f4f7fa;" class="ion-padding">
      <ion-button expand="block" color="secondary" (click)="nuevoUsuario()">
        <ion-icon name="person-add-outline" slot="start"></ion-icon> Registrar Nuevo Usuario
      </ion-button>
      <div *ngFor="let u of usuarios; let i = index" style="background: white; padding: 15px; border-radius: 15px; margin-top: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
        <ion-input [(ngModel)]="u.nombre" label="Nombre Completo" labelPlacement="floating"></ion-input>
        <ion-input [(ngModel)]="u.email" label="Correo Electrónico" type="email" labelPlacement="floating"></ion-input>
        <ion-grid style="padding: 0; margin-top: 10px;">
          <ion-row>
            <ion-col size="6">
              <ion-select [(ngModel)]="u.rol" label="Rol" labelPlacement="floating" interface="popover" style="background: #f9f9f9; border-radius: 8px;">
                <ion-select-option value="Administrador">Admin</ion-select-option>
                <ion-select-option value="Premium">Premium</ion-select-option>
                <ion-select-option value="Básico">Básico</ion-select-option>
              </ion-select>
            </ion-col>
            <ion-col size="6">
              <ion-button expand="block" size="small" [color]="u.suspendido ? 'success' : 'warning'" (click)="u.suspendido = !u.suspendido" style="margin-top: 5px;">
                {{ u.suspendido ? 'Activar' : 'Suspender' }}
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>
        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <ion-button size="small" color="primary" expand="block" style="flex: 1;" (click)="guardarUsuario()"><ion-icon name="save-outline" slot="start"></ion-icon> Guardar</ion-button>
          <ion-button size="small" color="danger" (click)="eliminarUsuario(i)"><ion-icon name="trash-outline"></ion-icon></ion-button>
        </div>
      </div>
    </ion-content>
  `
})
export class UsuariosModalComponent {
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  usuarios = [
    { nombre: 'Juan Pérez', email: 'juan@mail.com', rol: 'Básico', suspendido: false },
    { nombre: 'María López', email: 'maria@mail.com', rol: 'Premium', suspendido: true }
  ];
  nuevoUsuario() { this.usuarios.unshift({ nombre: '', email: '', rol: 'Básico', suspendido: false }); }
  async guardarUsuario() {
    const alert = await this.alertCtrl.create({ header: 'Sincronizado', message: 'Datos del usuario guardados.', buttons: ['OK'] });
    await alert.present();
  }
  eliminarUsuario(index: number) { this.usuarios.splice(index, 1); }
  cerrar() { this.modalCtrl.dismiss(); }
}

// =======================================================================
// 3️⃣ VENTANA: LOGS Y CONFIGURACIÓN MÉDICA (CON CRUD DE VACUNAS)
// =======================================================================
@Component({
  selector: 'app-logs-modal',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonIcon, IonListHeader, CommonModule],
  template: `
    <ion-header><ion-toolbar color="primary"><ion-title>Sistema y Logs</ion-title><ion-buttons slot="end"><ion-button (click)="cerrar()">Cerrar</ion-button></ion-buttons></ion-toolbar></ion-header>
    <ion-content style="--background: #f4f7fa;">
      <ion-list style="margin: 15px; border-radius: 15px;">
        <ion-list-header>LOGS DE ERRORES (LARAVEL/ESP32)</ion-list-header>
        <ion-item *ngFor="let log of logs">
          <ion-icon name="server-outline" color="danger" slot="start"></ion-icon>
          <ion-label><h2>{{ log.error }}</h2><p>{{ log.tiempo }}</p></ion-label>
        </ion-item>
        
        <ion-list-header style="margin-top: 15px;">CATÁLOGO DE VACUNAS GLOBALES</ion-list-header>
        <ion-item *ngFor="let vacuna of vacunas; let i = index">
          <ion-label>{{ vacuna.nombre }}</ion-label>
          <ion-button slot="end" size="small" color="primary" (click)="editarVacuna(i)">Editar</ion-button>
          <ion-button slot="end" size="small" color="danger" fill="clear" (click)="eliminarVacuna(i)"><ion-icon name="trash-outline" slot="icon-only"></ion-icon></ion-button>
        </ion-item>
      </ion-list>
      <div class="ion-padding">
        <ion-button expand="block" color="secondary" (click)="agregarVacuna()">
          <ion-icon name="add-circle-outline" slot="start"></ion-icon> Agregar Nueva Vacuna
        </ion-button>
      </div>
    </ion-content>
  `
})
export class LogsModalComponent {
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);

  logs = [{ error: 'Timeout ESP32', tiempo: 'Hace 5 min' }];
  vacunas = [{ nombre: 'Rabia' }, { nombre: 'Parvovirus' }, { nombre: 'Desparasitación' }];

  cerrar() { this.modalCtrl.dismiss(); }

  async editarVacuna(index: number) {
    const alert = await this.alertCtrl.create({
      header: 'Editar Vacuna',
      inputs: [{ name: 'nuevoNombre', type: 'text', value: this.vacunas[index].nombre, placeholder: 'Nombre' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', handler: (data) => { if(data.nuevoNombre) this.vacunas[index].nombre = data.nuevoNombre; } }
      ]
    });
    await alert.present();
  }

  async agregarVacuna() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva Vacuna',
      inputs: [{ name: 'nombre', type: 'text', placeholder: 'Ej. Bordetella' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Agregar', handler: (data) => { if(data.nombre) this.vacunas.push({ nombre: data.nombre }); } }
      ]
    });
    await alert.present();
  }

  eliminarVacuna(index: number) { this.vacunas.splice(index, 1); }
}

// =======================================================================
// CEREBRO PRINCIPAL (LA PÁGINA DEL PERFIL)
// =======================================================================
@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonListHeader, IonGrid, IonRow, IonCol, IonInput]
})
export class PerfilPage {
  public router = inject(Router);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  
  userRole: 'administrador' | 'cliente' = 'administrador';

  editandoInventario: boolean = false;
  listaProductos = [
    { nombre: 'Collar GPS Atja', sku: 'ATJ-01', precio: 850, stock: 15 },
    { nombre: 'Batería Repuesto', sku: 'BAT-09', precio: 250, stock: 40 }
  ];

  constructor() {
    addIcons({ 
      repeatOutline, storefrontOutline, hardwareChipOutline, warningOutline, 
      peopleOutline, statsChartOutline, pawOutline, mapOutline, cardOutline, 
      logOutOutline, chevronForwardOutline, batteryChargingOutline, medicalOutline,
      pulseOutline, serverOutline, trashOutline, addCircleOutline, createOutline,
      personAddOutline, saveOutline
    });
  }

  cambiarRol() { 
    this.userRole = this.userRole === 'administrador' ? 'cliente' : 'administrador'; 
    this.editandoInventario = false; 
  }

  // FUNCIONES DE INVENTARIO
  abrirInventario() { this.editandoInventario = true; }
  cerrarInventario() { this.editandoInventario = false; }
  nuevoProducto() { this.listaProductos.unshift({ nombre: '', sku: 'NUEVO', precio: 0, stock: 0 }); }
  eliminarProducto(index: number) { this.listaProductos.splice(index, 1); }
  async guardarCambiosInventario() {
    const alert = await this.alertCtrl.create({ header: '¡Éxito!', message: 'Inventario actualizado en la base de datos.', buttons: ['OK'] });
    await alert.present();
    this.editandoInventario = false;
  }

  // FUNCIONES PARA ABRIR LOS MODALES
  async abrirMonitorESP32() { const m = await this.modalCtrl.create({ component: DispositivosModalComponent }); await m.present(); }
  async abrirGestionUsuarios() { const m = await this.modalCtrl.create({ component: UsuariosModalComponent }); await m.present(); }
  async abrirLogsYConfiguracion() { const m = await this.modalCtrl.create({ component: LogsModalComponent }); await m.present(); }

  irAMisMascotas() { this.router.navigate(['/home']); }
  logout() { this.router.navigate(['/login']); }
}