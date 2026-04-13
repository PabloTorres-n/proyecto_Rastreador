const mongoose = require('mongoose');

const historialSchema = new mongoose.Schema({
  // Vinculamos el punto al cliente (dueño)
  clienteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cliente', 
    required: true 
  },
  // Vinculamos el punto a la mascota específica
  mascotaId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Mascota', 
    required: true 
  },
  // Coordenadas
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  
  // Fecha y hora del punto
  fecha: { type: Date, default: Date.now },
  
  // Opcional: datos de la LillyGO
  bateria: Number,
  velocidad: Number
});

// Índice para que buscar rutas sea rápido
historialSchema.index({ mascotaId: 1, fecha: -1 });

module.exports = mongoose.model('Historial', historialSchema);