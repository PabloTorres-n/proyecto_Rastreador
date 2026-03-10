import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    // Si hay token, permitimos el acceso a la ruta
    return true; 
  } else {
    // Si no hay token, lo mandamos al login
    router.navigate(['/login']);
    return false;
  }
};