const mongoose = require('mongoose');

const MascotaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    especie: {
        type: String,
        default: 'Perro'
    },
    // --- EL PUENTE ---
    // Aquí guardas el ID que viene del ESP32 (MAC Address o COLLAR-01)
    collarId: {
        type: String,
        unique: true, // Evita que dos perros tengan el mismo collar al mismo tiempo
        sparse: true  // Permite que haya mascotas sin collar asignado temporalmente
    },
    // --- ESTADO EN TIEMPO REAL ---
    lat: {
        type: Number,
        default: 20.6736 
    },
    lng: {
        type: Number,
        default: -103.344
    },
    foto_url: { type: String, default: null },
    bateria: {
        type: Number,
        default: 100
    },temperatura:Number,
    // --- RELACIONES ---
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cliente', 
        required: true
    },
    ultimaActualizacion: {
        type: Date,
        default: Date.now
    },
    sos: { type: Boolean, default: false },
    intervalo: { type: Number, default: 15000 },
    
    // GEOCERCA
    geoActive: { type: Boolean, default: false },
    geoLat: { type: Number, default: 0 },
    geoLng: { type: Number, default: 0 },
    geoRadio: { type: Number, default: 100 },
    buzzer: { 
        type: String, 
        default: 'off',
        enum: ['off', 'find', 'sos'] // Solo permite estos valores
    }, // metros
    ultimaConexion:{type:Date},
    alerta_geocerca: {
    type: Boolean,
    default: false // Importante que empiece en false
  },
});

module.exports = mongoose.model('Mascota', MascotaSchema);