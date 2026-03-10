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
    // Coordenadas para el mapa
    lat: {
        type: Number,
        default: 20.6736 // Guadalajara por defecto
    },
    lng: {
        type: Number,
        default: -103.344
    },
    bateria: {
        type: Number,
        default: 100
    },
    // RELACIÓN: Aquí ligamos la mascota con un Usuario
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario', // Debe coincidir con el nombre que le diste al modelo de Usuario
        required: true
    },
    ultimaActualizacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Mascota', MascotaSchema);