const Cliente = require('../models/Cliente');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// REGISTRAR
exports.registrarCliente = async (req, res) => {
    const errores = validationResult(req);
    console.log(req.body)
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
// Asegúrate de tenerlo instalado

exports.cambiarPassword = async (req, res) => {
    try {
        const { idUsuario } = req.params;
        const { current_password, new_password } = req.body;

        // 1. IMPORTANTE: Agregamos .select('+password') 
        // para forzar a MongoDB a traernos el hash
        const cliente = await Cliente.findById(idUsuario).select('+contrasena');

        if (!cliente) {
            return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
        }

        // 2. LOG DE SEGURIDAD (Solo para debug, borralo después)
        console.log("Hash encontrado:", cliente.contrasena? "SÍ" : "NO");

        // 3. Comparar (Ahora cliente.password ya no será undefined)
        const validPassword = await bcrypt.compare(current_password, cliente.contrasena);
        
        if (!validPassword) {
            return res.status(400).json({ ok: false, msg: "La contraseña actual es incorrecta" });
        }

        // 4. Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        cliente.contrasena = await bcrypt.hash(new_password, salt);
        
        await cliente.save();

        res.json({ ok: true, msg: "Contraseña actualizada correctamente" });

    } catch (error) {
        console.error("Error en cambiarPassword:", error);
        res.status(500).json({ ok: false, msg: "Error interno del servidor" });
    }
};

// LOGIN
exports.login = async (req, res) => {
      console.log(req.body)
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