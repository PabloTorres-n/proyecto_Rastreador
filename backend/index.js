const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// CONEXIÓN A MONGODB
mongoose.connect('mongodb://127.0.0.1:27017/rastreador_db')
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error de conexión:', err));

// --- MODELOS ---

// Mi esquema para las coordenadas del perro
const Ubicacion = mongoose.model('Ubicacion', {
    serial: String,
    lat: Number,
    lng: Number,
    bateria: Number,
    fecha: { type: Date, default: Date.now }
});

// NUEVO: Mi esquema para los usuarios del sistema
const Usuario = mongoose.model('Usuario', {
    nombre: String,
    email: { type: String, unique: true },
    pass: String // En un proyecto real usaríamos cifrado
});

// --- RUTAS ---

// Ruta de Login (Para que mi App se conecte)
app.post('/api/login', async (req, res) => {
    try {
        const { email, pass } = req.body;
        // Busco en mi NoSQL si el usuario y contraseña coinciden
        const user = await Usuario.findOne({ email, pass });
        
        if (user) {
            res.json({ success: true, nombre: user.nombre });
        } else {
            res.status(401).json({ success: false, mensaje: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Guardar ubicación (ESP32 / Simulador)
app.post('/api/ubicacion', async (req, res) => {
    const nuevaUbicacion = new Ubicacion(req.body);
    await nuevaUbicacion.save();
    res.status(201).send('OK');
});

// Leer ubicación (App Móvil)
app.get('/api/historial/:serial', async (req, res) => {
    const datos = await Ubicacion.find({ serial: req.params.serial }).sort({ fecha: -1 }).limit(1);
    res.json(datos);
});

app.listen(3000, () => console.log('🚀 Servidor listo en puerto 3000'));