const { Router } = require('express');
const express = require('express');
const router = Router();
const auth = require('../middlewares/auth');
// 1. Importamos AMBOS controladores
const MascotaController = require('../Controllers/MascotaController');
const CollarController = require('../Controllers/CollarController'); // 👈 Nuevo
const Mascota =require("../models/Mascota");
const jsonParser = express.json(); 

// --- RUTAS DE MASCOTAS (Gestión de Perfil) ---
router.post('/registrar', jsonParser, MascotaController.crearMascota);
router.get('/usuario/:usuarioId', MascotaController.obtenerMascotasPorUsuario);
router.get('/historial/:mascotaId', MascotaController.obtenerHistorial);
router.get('/detalle/:id', MascotaController.obtenerMascotaPorId);
router.delete('/:id',auth, MascotaController.eliminarMascota);
// --- RUTAS DE COLLAR (Gestión de Hardware e IoT) ---

// A. Esta es la que usará el ESP32 (Cambiamos MascotaController por CollarController)
// URL: /api/mascotas/actualizar-gps
router.post('/actualizar-gps', jsonParser, CollarController.actualizarPosicionGps);

// B. Registro de fábrica del collarId (MAC)
router.post('/collar/registrar', jsonParser, CollarController.registrarNuevoCollar);

// C. Vinculación: Unir la Mascota con el CollarId
router.put('/collar/vincular', jsonParser, CollarController.vincularCollarAMascota);
router.put('/actualizar/Ajustes/:id', jsonParser, MascotaController.actualizarConfiguracionMascota);
router.put('/desvincular/:idMascota', CollarController.desvincularDispositivo);
router.get('/:id/historial', auth, MascotaController.obtenerHistorial);

router.get('/fix-database', async (req, res) => {
    try {
        // updateMany busca todos los documentos ({}) 
        // y les agrega ($set) los campos faltantes
        await Mascota.updateMany({}, { 
            $set: { 
                sos: false, 
                intervalo: 15000,
                geoActive: false,
                geoLat: 0,
                geoLng: 0,
                geoRadio: 100
            } 
        });
        res.json({ ok: true, msg: "Todos los documentos actualizados" });
    } catch (e) {
        res.json({ ok: false, error: e.message });
    }
});




module.exports = router;