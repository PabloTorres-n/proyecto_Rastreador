const { Router } = require('express');
const router = Router();
const  MascotaController  = require('../Controllers/MascotaController');

// POST: /api/mascotas/registrar
router.post('/registrar', MascotaController.crearMascota);

// GET: /api/mascotas/usuario/:usuarioId (Para cargar el mapa)
router.get('/usuario/:usuarioId',MascotaController.obtenerMascotasPorUsuario);

// PUT: /api/mascotas/update-pos (Este lo usará el ESP32 o la App)


module.exports = router;