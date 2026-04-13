const express = require('express');
const router = express.Router();
const authController = require('../Controllers/AuthController'); // Asegúrate que la C y A sean iguales a tu carpeta
const { check } = require('express-validator');

// @route   POST api/auth/registrar
router.post('/registrar', [
    check('nombre', 'El nombre solo debe contener letras').isAlpha('es-ES', {ignore: ' '}),
    check('correo', 'Ingresa un email válido').isEmail(),
    check('contrasena', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 })
], authController.registrarCliente); // Solo llamamos a la función

// @route   POST api/auth/login
router.post('/login', [
    check('correo', 'Ingresa un correo válido').isEmail(),
    check('contrasena', 'La contraseña es requerida').notEmpty()
], authController.login); // Solo llamamos a la función

router.put('/clientes/cambiar-password/:idUsuario', authController.cambiarPassword);
module.exports = router;