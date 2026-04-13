const Mascota = require('../models/Mascota');
const Historial = require('../models/Historial');
exports.crearMascota = async (req, res) => {
    try {
        // El usuarioId debería venir del token o del body
        const nuevaMascota = new Mascota(req.body);
        
        await nuevaMascota.save();
        
        res.status(201).json({
            ok: true,
            mascota: nuevaMascota
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error al crear la mascota'
        });
    }
};

exports.obtenerMascotasPorUsuario = async (req, res) => {
    const { usuarioId } = req.params;
    
    const mascotas = await Mascota.find({ usuario: usuarioId });
    
    res.json({
        ok: true,
        mascotas
    });
};



exports.obtenerHistorial = async (req, res) => {
    try {
        const { mascotaId } = req.params;
        const puntos = await Historial.find({ mascotaId }).sort({ fecha: 1 });
        res.status(200).json(puntos);
    } catch (error) {
        res.status(500).json({ msg: "Error al obtener historial" });
    }
};

exports.obtenerMascotaPorId = async (req, res) => {
    try {
        const { id } = req.params; // Extrae el ID de la URL

        const mascota = await Mascota.findById(id);

        if (!mascota) {
            return res.status(404).json({ 
                ok: false, 
                msg: "Mascota no encontrada" 
            });
        }

        // Devolvemos la mascota directamente o envuelta en un objeto
        res.json({
            ok: true,
            mascota // Esto es lo que recibirá tu service en el .pipe(map(res => res.mascota))
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            ok: false, 
            msg: "Error al obtener los detalles de la mascota",
            error: error.message 
        });
    }
};
// Este endpoint es para la APP, no para el ESP32
exports.actualizarConfiguracionMascota = async (req, res) => {
    const { id } = req.params; // El ID de la mascota
    const cambios = req.body;  // Los ajustes (sos, intervalo, geoActive, etc.)

    try {
        // Actualizamos la mascota en la DB
        const mascotaActualizada = await Mascota.findByIdAndUpdate(
            id,
            { $set: cambios },
            { new: true } // Para devolver el objeto ya cambiado
        );

        if (!mascotaActualizada) {
            return res.status(404).json({ ok: false, msg: "Mascota no encontrada" });
        }

        console.log(`⚙️ Ajustes actualizados para ${mascotaActualizada.nombre}:`, cambios);

        res.json({
            ok: true,
            msg: "Configuración guardada correctamente",
            mascota: mascotaActualizada
        });

    } catch (error) {
        console.error("❌ Error al actualizar ajustes:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
};

exports.eliminarMascota = async (req, res) => {
    console.log(req.params);
    console.log("Contenido de req.user (Token):", req.user);
    try {
        const idMascota = req.params.id;
        const idUsuario = req.user._id; // Extraído de tu middleware de auth (JWT)

        // 1. Buscar la mascota por su ID y validar que el dueño coincida
        const mascota = await Mascota.findOne({ _id: idMascota, usuario: idUsuario });

        if (!mascota) {
            return res.status(404).json({ 
                mensaje: "Mascota no encontrada o no tienes permiso para realizar esta acción." 
            });
        }

        // 2. Eliminar de MongoDB
        await Mascota.findByIdAndDelete(idMascota);

        // 3. Respuesta de éxito
        res.json({ 
            mensaje: "Mascota eliminada correctamente del servidor de monitoreo." 
        });

    } catch (error) {
        console.error("Error al eliminar mascota:", error);
        res.status(500).json({ 
            mensaje: "Error interno del servidor al procesar la eliminación." 
        });
    }
};


exports.obtenerHistorial = async (req, res) => {
    try {
        const { id } = req.params;
        const { desde, hasta } = req.query;

        let filtro = { mascotaId: id };

        if (desde && hasta) {
            filtro.fecha = {
                $gte: new Date(desde + "T00:00:00Z"),
                $lte: new Date(hasta + "T23:59:59Z")
            };
        }

        // 1. Obtenemos los puntos (importante ordenar ascendente para el filtro de tiempo)
        const historial = await Historial.find(filtro)
            .sort({ fecha: 1 }); 

        // 2. LÓGICA DE FILTRADO (Cada 5 minutos)
        const historialFiltrado = [];
        let ultimaFechaGuardada = null;

        historial.forEach((punto) => {
            const fechaPunto = new Date(punto.fecha);

            // Si es el primero, o si pasaron más de 5 minutos desde el último guardado
            if (!ultimaFechaGuardada || (fechaPunto - ultimaFechaGuardada) >= 5 * 60 * 1000) {
                historialFiltrado.push(punto);
                ultimaFechaGuardada = fechaPunto;
            }
        });

        // 3. Enviamos la data limpia y optimizada
        res.json(historialFiltrado);

    } catch (error) {
        console.error("Error historial:", error);
        res.status(500).json({ mensaje: "Error al obtener el historial" });
    }
};