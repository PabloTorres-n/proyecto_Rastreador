import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private url = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  // Método para registrar un collar/usuario
  registrar(datos: any) {
    return this.http.post(`${this.url}/registrar`, datos);
  }

  // Método para el login
  login(credenciales: { correo: string, contrasena: string }) {
  return this.http.post<any>(`${this.url}/login`, credenciales).pipe(
    tap(res => {
      // Si el backend responde con ok: true, guardamos todo
      if (res.ok) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
      }
    })
  );
}
}