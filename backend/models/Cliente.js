const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  rol: { type: String, default: 'cliente' },
  // RELACIÓN: Array de IDs de sus mascotas
  mascotas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mascota' }],
  perfil: {
    telefono: String,
    ciudad: String,
    direccion: String
  },
  configuracion: {
    notificaciones_push: { type: Boolean, default: true },
    idioma: { type: String, default: 'es' }
  },
  fecha_creacion: { type: Date, default: Date.now }
});

// FUNCIÓN PARA GENERAR EL TOKEN
clienteSchema.methods.generateAuthToken = function() {
 
  const token = jwt.sign(
    { 
      _id: this._id, 
      rol: this.rol,
      nombre: this.nombre 
    }, 
    'PalabraSecreta_AtjaYaala_2024', // En producción usa: process.env.JWT_SECRET
    { expiresIn: '7d' } // El token expira en 7 días
  );
  return token;
};
// models/Usuario.js


// Este código dice: "Antes de que cualquier usuario se guarde en la BD..."
clienteSchema.pre('save', async function() { // 👈 Quitamos 'next' de aquí
    if (!this.isModified('contrasena')) return; // 👈 Ya no llamamos a next()

    try {
        const salt = await bcrypt.genSalt(10);
        this.contrasena = await bcrypt.hash(this.contrasena, salt);
        // 👈 No hace falta llamar a next(), se hace solo al terminar la función
    } catch (error) {
        throw error; // Si hay error, Mongoose lo captura
    }
});

module.exports = mongoose.model('Cliente', clienteSchema);