import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MascotasService {
  private apiUrl = `${environment.apiUrl}/mascotas`;
  private mascotasSubject = new BehaviorSubject<any[]>([]);
  
  // --- NUEVO: Puente para comunicar el Listado con el Mapa ---
  private mascotaSeleccionadaSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  getMascotas(): Observable<any[]> {
    return this.mascotasSubject.asObservable();
  }

  // --- NUEVOS MÉTODOS PARA SELECCIÓN ---
  setMascotaSeleccionada(pet: any) {
    this.mascotaSeleccionadaSubject.next(pet);
  }

  getMascotaSeleccionada(): Observable<any> {
    return this.mascotaSeleccionadaSubject.asObservable();
  }

  limpiarSeleccion() {
    this.mascotaSeleccionadaSubject.next(null);
  }
  // -------------------------------------------------------

  // Carga inicial (GET)
cargarMascotasDesdeBD(usuarioId: string) {
  const urlCompleta = `${this.apiUrl}/usuario/${usuarioId}`;
  console.log('🌍 URL generada:', urlCompleta); // <-- Si no ves esto, la función no se ejecuta

  return this.http.get<any>(urlCompleta).pipe(
    tap(res => console.log('📨 Respuesta bruta del servidor:', res)), // <-- Log antes del map
    map(res => {
      const datos = res && res.mascotas ? res.mascotas : [];
      console.log('🔍 Mapeando respuesta a:', datos);
      return datos;
    }),
    tap(listaMascotas => {
      console.log('✅ Actualizando Subject con:', listaMascotas.length, 'mascotas');
      this.mascotasSubject.next(listaMascotas); 
    })
   
  );
}
  // Registro (POST)
  registrarMascota(nuevaMascota: any) {
    return this.http.post<any>(`${this.apiUrl}/registrar`, nuevaMascota).pipe(
      map(res => res.mascota || res), 
      tap(mascotaCreada => {
        const listaActual = this.mascotasSubject.value;
        this.mascotasSubject.next([...listaActual, mascotaCreada]);
      })
    );
  }
}