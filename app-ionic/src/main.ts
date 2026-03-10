import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules,withViewTransitions } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient,withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptor/interceptor';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

/**
 * CAMBIO PARA CORDOVA: 
 * Importamos el Geolocation de la librería de Awesome Cordova Plugins.
 */
import { Geolocation } from '@awesome-cordova-plugins/geolocation/ngx';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      rippleEffect: true,
      mode: 'md', 
      navAnimation: undefined
    }),
    provideRouter(routes, withPreloading(PreloadAllModules),withViewTransitions()),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ), 
    
    /**
     * REGISTRO DEL SENSOR:
     * Agregamos Geolocation a la lista de proveedores para que 
     * el mapa y el sistema de rastreo puedan acceder al GPS del celular.
     */
    Geolocation,
  ],
});