import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { IonApp, IonRouterOutlet, IonIcon, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from '@ionic/angular/standalone'; 
import { filter } from 'rxjs/operators';
import { addIcons } from 'ionicons'; 
import { home, location, person, settingsSharp,paw} from 'ionicons/icons'; 
import { CommonModule } from '@angular/common'; // Importante para el [disabled]

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  // MODIFICADO: Agregamos IonMenu y los componentes necesarios para el menú
  imports: [IonApp, IonRouterOutlet, IonIcon, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, CommonModule]
})
export class AppComponent implements OnInit {
  // Inicializamos vacío para que no asuma 'home' antes de verificar
  rutaActual: string = '';

  constructor(private router: Router) {
    this.initializeApp();
    
    addIcons({ 
      home, 
      location, 
      person, 
      'settings-sharp': settingsSharp,
      paw
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Obtenemos el nombre de la ruta (login, home, etc.)
      const ruta = event.urlAfterRedirects.split('/')[1] || 'home';
      this.rutaActual = ruta;
      console.log('Navegando a:', this.rutaActual);
    });
  }

  ngOnInit() {
  // Escuchar si el usuario cambia el tema del sistema (solo si no hay preferencia guardada)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (localStorage.getItem('darkMode') === null) {
      this.aplicarClaseDark(e.matches);
    }
  });
}

checkTheme() {
  const savedTheme = localStorage.getItem('darkMode');
  let isDark: boolean;

  if (savedTheme !== null) {
    isDark = savedTheme === 'true';
  } else {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Aplicamos de inmediato
  this.aplicarClaseDark(isDark);
}

private aplicarClaseDark(isDark: boolean) {
  // Usamos toggle para que sea más limpio
  document.body.classList.toggle('dark', isDark);
}
  async initializeApp() {
    this.checkTheme();

    try {
      await SplashScreen.hide();
    } catch (e) {
      console.warn('Splash no disponible');
    }
  }

  navegar(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }
}