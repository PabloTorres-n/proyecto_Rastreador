const Cliente= require('../models/Cliente');
const Collar = require('../models/Collar');
const mongoose = require('mongoose');
// En tu controlador de Clientes (Backend)
exports.actualizarToken = async (req, res) => {
    console.log(req.body);
    try {
        const { userId, token } = req.body;
        
        // Convertimos el string a ObjectId de forma segura
        const objectId = new mongoose.Types.ObjectId(userId);

        const usuarioActualizado = await Cliente.findByIdAndUpdate(
            objectId, 
            { $set: { pushToken: token } }, // Usamos $set para asegurar la escritura
            { new: true }
        );

        if (!usuarioActualizado) {
            console.log("❌ No se encontró el usuario con ID:", userId);
            return res.status(404).json({ ok: false, msg: "Usuario no existe en BD" });
        }

        console.log("✅ Token actualizado en BD para:", usuarioActualizado.email);
        res.json({ ok: true, usuario: usuarioActualizado });

    } catch (error) {
        console.error("🔥 Error en actualizarToken:", error);
        res.status(500).json({ ok: false, error });
    }
};
// Ejemplo rápido en Node.js
exports.obtenerPerfil = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id).select('-password');
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener datos" });
    }
};

exports.obtenerCollaresPorUsuario = async (req, res) => {
    try {
        const { idUsuario } = req.params;
        
        // Buscamos todos los collares que pertenecen a este humano
        // Hacemos populate de 'mascotaActual' para saber el nombre del perro si tiene uno
        const collares = await Collar.find({ id_usuario: idUsuario })
                                     .populate('mascotaActual'); 

        res.json({
            ok: true,
            collares
        });
    } catch (error) {
        console.error("🔥 Error en el servidor:", error);
        res.status(500).json({ ok: false, msg: "Error al obtener tus dispositivos" });
    }
};

exports.actualizarPerfil = async (req, res) => {
    try {
        const { idUsuario } = req.params; // O req.body.userId según cómo envíes la petición
        const { nombre, telefono  } = req.body;

        // 1. Procesamos la dirección: 
        // Si viene como string "Calle 1, Colonia, Ciudad", lo convertimos a ["Calle 1", "Colonia", "Ciudad"]
      

        // 2. Actualizamos en MongoDB
        const clienteActualizado = await Cliente.findByIdAndUpdate(
            idUsuario,
            { 
                nombre, 
                telefono, 
                 // Guardamos como Array
            },
            { new: true } // Para que devuelva el documento ya modificado
        ).select('-password');

        if (!clienteActualizado) {
            return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
        }

        // 3. Respuesta al Frontend (Blade)
        // Si el formulario en Blade hace un submit tradicional, usa res.redirect
        // Si usas Fetch/Axios, usa res.json
        res.json({
            ok: true,
            msg: "Perfil actualizado correctamente",
            cliente: clienteActualizado
        });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ ok: false, msg: "Error interno al guardar cambios" });
    }
};