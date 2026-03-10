import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authGuard } from './guards/auth-guard'; // Asegúrate de que la ruta sea correcta

export const routes: Routes = [
  { 
    path: '', 
    // ✨ REDIRECCIÓN INTELIGENTE: Si hay token va al mapa, si no al login
    redirectTo: localStorage.getItem('token') ? 'home' : 'login', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage) 
  },
  {
    path:'mascotas',
    loadComponent:() => import('./mascotas/mascotas.component').then(m=>m.MascotasComponent)
  },
  { 
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then(m => m.RegistroPage)
  },
  // 🔐 RUTAS PROTEGIDAS (Solo entran si están logueados)
  { 
    path: 'home', 
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [authGuard] 
  },
  { 
    path: 'mapa', 
    loadComponent: () => import('./mapa/mapa.page').then(m => m.MapaPage),
    canActivate: [authGuard] 
  },
  { 
    path: 'perfil', 
    loadComponent: () => import('./perfil/perfil.page').then(m => m.PerfilPage),
    canActivate: [authGuard] 
  },
  { 
    path: 'ajustes', 
    loadComponent: () => import('./ajustes/ajustes.page').then(m => m.AjustesPage),
    canActivate: [authGuard] 
  },
  {
    path: 'expediente',
    loadComponent: () => import('./expediente/expediente.page').then(m => m.ExpedientePage),
    canActivate: [authGuard]
  },
  {
    path: 'tienda',
    loadComponent: () => import('./tienda/tienda.page').then( m => m.TiendaPage),
    canActivate: [authGuard]
  }
];