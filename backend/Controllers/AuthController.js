const Cliente = require('../models/Cliente');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// REGISTRAR
exports.registrarCliente = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ ok: false, errores: errores.array() });
    }

    const { nombre, correo, contrasena } = req.body;

    try {
        let cliente = await Cliente.findOne({ correo });
        if (cliente) return res.status(400).json({ ok: false, msg: 'El usuario ya existe' });

        cliente = new Cliente(req.body);

        // Si ya tienes el .pre('save') en el modelo, borra estas 2 líneas:
       

        await cliente.save();
        
        const token = cliente.generateAuthToken();
        res.status(201).json({ ok: true, token, msg: 'Usuario creado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: 'Error en el servidor' });
    }
};

// LOGIN
exports.login = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ ok: false, errores: errores.array() });
    }

    const { correo, contrasena } = req.body;

    try {
        const user = await Cliente.findOne({ correo });
        if (!user) return res.status(400).json({ ok: false, msg: 'Correo o contraseña incorrectos' });

        // Comparación con Bcrypt (Porque ya está encriptada en la BD)
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) return res.status(400).json({ ok: false, msg: 'Correo o contraseña incorrectos' });

        const token = user.generateAuthToken();

        res.json({
            ok: true,
            token,
            usuario: { id: user._id, nombre: user.nombre, correo: user.correo }
        });
    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error en el servidor' });
    }
};