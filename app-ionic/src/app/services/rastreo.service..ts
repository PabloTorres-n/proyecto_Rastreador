import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RastreoService {
  // Inyecto la herramienta de HTTP para hacer peticiones
  private http = inject(HttpClient);

  /**
   * Esta es la URL de tu API en Laravel.
   * IMPORTANTE: Si pruebas en un celular real, usa tu IP (ej: 192.168.1.65) 
   * en lugar de localhost.
   */
  private apiUrl = 'http://localhost:8000/api'; 

  constructor() { }

  /**
   * YO, como desarrollador, uso esta función para obtener 
   * la última coordenada guardada en MySQL.
   */
  getUltimaUbicacion(serial: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/rastrear/${serial}`);
  }
}