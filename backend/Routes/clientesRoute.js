const express = require('express');
const router = express.Router();
const usuarioController = require('../Controllers/Clientes.Controller');
const CollarController = require('../Controllers/CollarController');
// Ruta: PUT /api/usuarios/push-token
router.put('/push-token', usuarioController.actualizarToken);
router.get('/:id', usuarioController.obtenerPerfil);
router.get('/collares/:idUsuario', usuarioController.obtenerCollaresPorUsuario);
router.patch('/collares/actualizar-apodo/:idCollar', CollarController.actualizarApodo);
router.put('/actualizar-perfil/:idUsuario', usuarioController.actualizarPerfil);
module.exports = router;