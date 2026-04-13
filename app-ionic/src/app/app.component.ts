import { Component, OnInit, inject, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { 
  IonApp, 
  IonRouterOutlet, 
  IonIcon, 
  IonMenu, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  AlertController 
} from '@ionic/angular/standalone'; 
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons'; 
import { home, location, person, settingsSharp, paw } from 'ionicons/icons'; 
import { CommonModule } from '@angular/common'; 
import { PushNotifications, ActionPerformed } from '@capacitor/push-notifications';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonApp, 
    IonRouterOutlet, 
    IonIcon, 
    IonMenu, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    CommonModule
  ]
})
export class AppComponent implements OnInit {
  rutaActual: string = '';
  
  // Inyectamos AlertController para las notificaciones de emergencia
  private alertCtrl = inject(AlertController);
private ngZone = inject(NgZone);
  constructor(private router: Router) {
    this.initializeApp();
    
    // Configuración de iconos globales
    addIcons({ 
      home, 
      location, 
      person, 
      'settings-sharp': settingsSharp,
      paw
    });

    // Rastreo de ruta para el menú lateral
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const ruta = event.urlAfterRedirects.split('/')[1] || 'home';
      this.rutaActual = ruta;
    });
  }

  ngOnInit() {
    // Escuchar cambios de tema del sistema operativo
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (localStorage.getItem('darkMode') === null) {
        this.aplicarClaseDark(e.matches);
      }
    });
  }

  // --- GESTIÓN DE TEMA (DARK MODE) ---
  checkTheme() {
    const savedTheme = localStorage.getItem('darkMode');
    let isDark: boolean;

    if (savedTheme !== null) {
      isDark = savedTheme === 'true';
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.aplicarClaseDark(isDark);
  }

  private aplicarClaseDark(isDark: boolean) {
    document.body.classList.toggle('dark', isDark);
  }

  // --- INICIALIZACIÓN DE LA APP ---
  async initializeApp() {
    this.checkTheme();
    
    const usuarioData = localStorage.getItem('usuario'); 
    if (usuarioData) {
      try {
        const usuarioObj = JSON.parse(usuarioData);
        const userId = usuarioObj.id; 

        if (userId) {
          console.log('✅ Usuario detectado, configurando notificaciones...');
          this.inicializarNotificaciones(userId);
        }
      } catch (e) {
        console.error('Error al parsear datos de usuario', e);
      }
    }

    try {
      await SplashScreen.hide();
    } catch (e) {
      console.warn('Splash no disponible');
    }
  }

  // --- GESTIÓN DE NOTIFICACIONES PUSH ---
  async inicializarNotificaciones(userId: string) {
    let perm = await PushNotifications.requestPermissions();

    if (perm.receive === 'granted') {
      await PushNotifications.register();

      // Registro de Token en Firebase
      PushNotifications.addListener('registration', (token) => {
        console.log('🔑 Nuevo Token FCM:', token.value);
        this.guardarTokenEnServidor(userId, token.value);
      });

      // A. EVENTO: App Abierta (Foreground)
      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        const data = notification.data;

        if (data.tipo === 'ALERTA_GEOCERCA') {
          // Lanzamos una alerta roja intrusiva
          const alert = await this.alertCtrl.create({
            header: '🚨 ¡ESCAPE DETECTADO!',
            subHeader: notification.title,
            message: notification.body,
            backdropDismiss: false, 
            cssClass: 'alerta-critica',
            buttons: [
              { text: 'Ignorar', role: 'cancel' },
              { 
                text: 'VER EN MAPA', 
                handler: () => {
                  this.router.navigate(['/home'], { 
                    queryParams: { lat: data.lat, lng: data.lng, escape: true } 
                  });
                } 
              }
            ]
          });
          await alert.present();
        } else if (data.tipo === 'ALERTA_RUIDO') {
          // Notificación simple para ladridos
          console.log('🐕 Ladrido detectado:', notification.body);
          // Aquí puedes añadir un Toast o un alert más simple
        }
      });

      // B. EVENTO: Al tocar la notificación (Background/Closed)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      const data = notification.notification.data;
      
      console.log('🚀 Click en notificación detectado:', data);

      if (data.tipo === 'ALERTA_GEOCERCA' && data.lat) {
        // 3. USA NgZone para forzar a Angular a navegar
        this.ngZone.run(() => {
          this.router.navigate(['/home']);
        });
      }
    });
    }
  }

  // --- COMUNICACIÓN CON EL BACKEND ---
  async guardarTokenEnServidor(userId: string, token: string) {
    const url = 'https://raestreadorfijo.vercel.app/api/clientes/push-token'; 
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token })
      });
      const data = await response.json();
      console.log('✅ Token guardado en servidor:', data);
    } catch (error) {
      console.error('❌ Error guardando token:', error);
    }
  }

  navegar(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }
}