const mongoose = require('mongoose');

const CollarSchema = new mongoose.Schema({
    // ID Físico (MAC Address o Serie que grabaste en el ESP32)
    collarId: {
        type: String,
        required: [true, 'El identificador físico es obligatorio'],
        unique: true,
        trim: true,
        sparse: true
    },
    id_usuario: {type: String},
    // Nombre "amigable" para el usuario (ej: "Collar Azul 01")
    apodo: {
        type: String,
        default: 'Nuevo Collar'
    },
    // Estado de salud del hardware
    bateria: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    firmwareVersion: {
        type: String,
        default: '1.0.0'
    },
    // Para saber si el collar está en línea o se perdió la señal
    ultimaConexion: {
        type: Date,
        default: Date.now
    },
    // Estado operativo
    estado: {
        type: String,
        enum: ['activo', 'mantenimiento', 'desconectado', 'stock'],
        default: 'stock'
    },
    // Relación inversa: ¿A qué mascota está asignado ahora?
    // (Opcional, pero útil para consultas rápidas de soporte)
    mascotaActual: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mascota',
        default: null
    },collarId: { type: String, default: null }
}, { timestamps: true,collection: 'collars' }); // Crea automáticamente createdAt y updatedAt

module.exports = mongoose.model('Collar', CollarSchema);