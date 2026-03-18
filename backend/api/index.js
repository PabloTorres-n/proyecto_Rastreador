require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('../config/db'); // Ajusta la ruta según tu carpeta
const Mascota = require('../models/Mascota');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a la DB (IMPORTANTE: Vercel conecta en cada petición)
conectarDB();

// --- RUTAS ---

// 1. La que usará la LilyGO (El Collar)
app.post('/api/update-location', async (req, res) => {
    try {
        const { petId, lat, lng } = req.body;
        
        // Actualizamos directamente en MongoDB
        await Mascota.findByIdAndUpdate(petId, { lat, lng });
        
        console.log(`📍 Ubicación de ${petId} actualizada: ${lat}, ${lng}`);
        res.status(200).json({ status: "ok", msg: "Ubicación guardada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/test', (req, res) => {
    res.json({ msg: "El servidor está vivo" });
});
// 2. La que usará tu App de Celular (Ionic) para ver el mapa
app.get('/api/mascotas/:id', async (req, res) => {
    try {
        const mascota = await Mascota.findById(req.params.id);
        res.json(mascota);
    } catch (error) {
        res.status(500).send('Error al obtener mascota');
    }
});

// Rutas de tus otros archivos
app.use('/api/auth', require('../Routes/AuthRoutes'));
app.use('/api/mascotas', require('../Routes/mascotasRouter'));

// IMPORTANTE PARA VERCEL: No uses app.listen()
module.exports = app;