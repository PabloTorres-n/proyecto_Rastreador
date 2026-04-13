
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Cliente {
  private API_URL = 'https://raestreadorfijo.vercel.app/api/clientes';

  constructor(private http: HttpClient) {}

  // Obtener perfil por ID
  getPerfil(id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/${id}`);
  }

  // Opcional: Para cuando quieras editar los datos
  updatePerfil(id: string, datos: any): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}`, datos);
  }

  getMisCollares(idUsuario: string): Observable<any> {
  return this.http.get(`${this.API_URL}/collares/${idUsuario}`);
}

actualizarApodoCollar(idCollar: string, nuevoApodo: string): Observable<any> {
  return this.http.patch(`${this.API_URL}/collares/actualizar-apodo/${idCollar}`, { nuevoApodo });
}
}
