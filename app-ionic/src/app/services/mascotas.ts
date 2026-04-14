import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, lastValueFrom } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Plugins de Capacitor
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Injectable({ providedIn: 'root' })
export class MascotasService {
  // Nota: La base suele ser http://tu-url.com/api/mascotas
  private apiUrl = `${environment.apiUrl}/mascotas`;
  
  private mascotasSubject = new BehaviorSubject<any[]>([]);
  private mascotaSeleccionadaSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  // --- GESTIÓN DE ESTADO LOCAL ---
  getMascotas(): Observable<any[]> { 
    return this.mascotasSubject.asObservable(); 
  }

  setMascotaSeleccionada(pet: any) { 
    this.mascotaSeleccionadaSubject.next(pet); 
  }

  getMascotaSeleccionada(): Observable<any> { 
    return this.mascotaSeleccionadaSubject.asObservable(); 
  }

  limpiarSeleccion() { 
    this.mascotaSeleccionadaSubject.next(null); 
  }

  // --- PETICIONES AL BACKEND ---

  cargarMascotasDesdeBD(usuarioId: string) {
    const url = `${this.apiUrl}/usuario/${usuarioId}`;
    return this.http.get<any>(url).pipe(
      map(res => res.mascotas || []),
      tap(lista => this.mascotasSubject.next(lista))
    );
  }

  getMascotaPorId(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/detalle/${id}`).pipe(
      map(res => res.mascota || res)
    );
  }

  // --- LÓGICA DE ESCANEO (Iot / Hardware) ---

  /**
   * Proceso completo: Pide permisos, abre cámara y procesa el resultado
   */
 async escanearYVincular(petId: string) {
  try {
    const granted = await this.solicitarPermisos();
    if (!granted) throw new Error("Permiso de cámara denegado por el usuario");

    // --- NUEVO: Verificación del módulo de Google ---
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    
    if (!available) {
      // Forzamos la descarga si no está presente
      await BarcodeScanner.installGoogleBarcodeScannerModule();
      
      // Lanzamos un error amigable o un aviso para que el usuario sepa 
      // que debe esperar unos segundos antes de reintentar.
      alert("El motor de escaneo de Google se está instalando. Por favor, espera 30 segundos y vuelve a intentarlo.");
      return null; 
    }
    // ------------------------------------------------

    // 1. Iniciar el scanner (Ahora sí, con el módulo garantizado)
    const result = await BarcodeScanner.scan();

    // 2. Validar que tengamos datos reales
    if (result && result.barcodes && result.barcodes.length > 0) {
      const macEscaneada = result.barcodes[0].displayValue;
      
      if (!macEscaneada) throw new Error("El código QR no contiene información");

      console.log("QR Detectado:", macEscaneada);

      // 3. Llamar a la vinculación y esperar respuesta del servidor
      return await this.vincularMAC(petId, macEscaneada);
    } else {
      console.log("Escaneo cancelado");
      return null; 
    }
  } catch (error) {
    console.error("Error en escanearYVincular:", error);
    // Tu función de diagnóstico personalizada aquí para ver detalles en el celular
    
    throw error; 
  }
}

  /**
   * Petición HTTP PUT para vincular el collar en la BD
   */
  async vincularMAC(petId: string, mac: string) {
    // La URL debe apuntar a la ruta que definiste en tu router de Node.js
    // Si tu apiUrl ya tiene "/mascotas", la ruta final será .../api/mascotas/collar/vincular
    const url = `${this.apiUrl}/collar/vincular`;
    
    const body = { 
      mascotaId: petId, 
      collarId: mac 
    };

    console.log("Petición de vinculación a:", url);
    
    // Usamos lastValueFrom en lugar de .toPromise()
    return await lastValueFrom(this.http.put(url, body));
  }

  /**
   * Manejo de permisos nativos de Android/iOS
   */
  async solicitarPermisos(): Promise<boolean> {
    const status = await BarcodeScanner.checkPermissions();
    
    if (status.camera === 'granted') {
      return true;
    }

    // Si no tiene permisos, los solicitamos
    const request = await BarcodeScanner.requestPermissions();
    return request.camera === 'granted';
  }

  actualizarAjustes(id: string, cambios: any): Observable<any> {
  // Asegúrate de que la URL coincida con tu servidor (ej: http://localhost:3000)
  return this.http.put(`${this.apiUrl}/actualizar/Ajustes/${id}`, cambios);

}
desvincularCollar(idMascota: string) {
  return this.http.put(`${this.apiUrl}/desvincular/${idMascota}`, {});
}


}