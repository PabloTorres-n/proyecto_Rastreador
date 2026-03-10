import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Obtenemos el token del almacenamiento
  const token = localStorage.getItem('token');

  // 2. Si el token existe, clonamos la petición y le añadimos el Header
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        'x-auth-token': token // 👈 Asegúrate que coincida con el nombre que usas en el Backend
      }
    });
    return next(cloned);
  }

  // 3. Si no hay token, la petición sigue su curso normal
  return next(req);
};