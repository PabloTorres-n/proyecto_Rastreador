export interface Cliente {
  _id?: string; // El ID que genera MongoDB
  nombre: string;
  correo: string;
  contrasena?: string; // Opcional, usualmente no la queremos de regreso
  rol: 'cliente' | 'admin'; // Usamos unión de tipos para mayor seguridad
  verificado: boolean;
  ultimo_acceso?: Date;
  perfil: {
    telefono?: string;
    direccion?: string;
    ciudad?: string;
  };
  mascotas: string[]; // Aquí guardaremos los IDs de sus mascotas
  fecha_creacion?: Date;
}