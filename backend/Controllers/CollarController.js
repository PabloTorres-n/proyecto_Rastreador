const Collar = require('../models/Collar');
const Mascota = require('../models/Mascota');
const Historial = require("../models/Historial");
const admin = require('../firebase-config');
// 1. REGISTRAR COLLAR (Provisionamiento de Fábrica)
// Se usa cuando terminas de armar el ESP32 y quieres darlo de alta en tu BD
exports.registrarNuevoCollar = async (req, res) => {
    try {
        const { collarId, apodo } = req.body;

        // Verificar si el ID (MAC Address) ya existe
        const existe = await Collar.findOne({ collarId });
        if (existe) {
            return res.status(400).json({ ok: false, msg: "Este ID de collar ya está registrado." });
        }

        const nuevoCollar = new Collar({
            collarId, // Ej: "30:AE:A4:07:0D:64"
            apodo: apodo || `Collar-${collarId.slice(-4)}`, // Usa los últimos 4 caracteres si no hay apodo
            estado: 'stock' 
        });

        await nuevoCollar.save();
        res.status(201).json({ ok: true, msg: "Collar creado exitosamente en el sistema", collar: nuevoCollar });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: "Error al registrar el hardware." });
    }
};

// 2. VINCULAR COLLAR A MASCOTA (Acción del Usuario)
// Se usa cuando el usuario entra a la App y elige qué perro usará qué collar
exports.vincularCollarAMascota = async (req, res) => {
    try {
        const { mascotaId, collarId } = req.body;
        console.log(req.body);
        const mascota = await Mascota.findById(mascotaId);
        if (!mascota) return res.status(404).json({ ok: false, msg: "La mascota no existe." });

        const usuarioId = mascota.usuario; // Obtenemos el ID del dueño
        // A. Verificar que el collar existe en el sistema
        const collar = await Collar.findOne({ collarId });
        if (!collar) {
            return res.status(404).json({ ok: false, msg: "El código del collar no es válido o no existe." });
        }

        // B. Verificar si el collar ya lo tiene otro perro (para evitar duplicados)
        const collarOcupado = await Mascota.findOne({ collarId: collarId });
        if (collarOcupado && collarOcupado._id.toString() !== mascotaId) {
            return res.status(400).json({ 
                ok: false, 
                msg: `Este collar ya está siendo usado por ${collarOcupado.nombre}. Desvincúlalo primero.` 
            });
        }

        // 2. VALIDACIÓN: ¿El collar ya está en otra mascota?
        const collarOcupado2 = await Collar.findOne({ collarId });
        if (collarOcupado2.mascotaActual && collarOcupado2.mascotaActual.toString() !== mascotaId) {
             return res.status(400).json({ 
                ok: false, 
                msg: "Este collar ya está siendo usado por otra mascota." 
            });
        }

        // C. Asignar el ID del collar al documento de la Mascota
        const mascotaActualizada = await Mascota.findByIdAndUpdate(
            mascotaId,
            { collarId: collarId },
            { returnDocument: 'after' }
        );

        if (!mascotaActualizada) {
            return res.status(404).json({ ok: false, msg: "La mascota no existe." });
        }

        // D. Actualizar el estado del collar a 'activo' y marcar a qué mascota pertenece
        collar.estado = 'activo';
        collar.mascotaActual = mascotaId;
        collar.id_usuario = usuarioId;
        await collar.save();

        res.json({ 
            ok: true, 
            msg: `¡Éxito! El collar ahora pertenece a ${mascotaActualizada.nombre}`,
            mascota: mascotaActualizada 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, msg: "Error en el proceso de vinculación." });
    }
};

// 3. RECIBIR DATOS DEL GPS (Función principal del ESP32)
// 3. RECIBIR DATOS DEL GPS (Función principal del ESP32)
exports.actualizarPosicionGps = async (req, res) => {
    console.log("📡 Datos recibidos del ESP32:", req.body);
    
    // 1. AGREGAMOS 'alerta_geocerca' a la desestructuración
    const { mac, lat, lng, temperatura, ladrido, alerta_geocerca } = req.body;
    
    try {
        const ahora = new Date();
        let updateMascota = { 
            temperatura, 
            ultimaConexion: ahora,
            alerta_geocerca
        };

        const tieneGpsValido = (lat != 0 && lng != 0 && lat != null && lng != null);
        
        if (tieneGpsValido) {
            updateMascota.lat = lat;
            updateMascota.lng = lng;
            updateMascota.ultimaActualizacion = ahora; 
        }

        await Collar.findOneAndUpdate({ collarId: mac }, {  ultimaConexion: ahora, estado: 'activo' });

        const mascota = await Mascota.findOneAndUpdate(
            { collarId: mac }, 
            { $set: updateMascota }, 
            { new: true }
        ).populate('usuario'); 

        if (!mascota) {
            return res.status(404).json({ ok: false, msg: "Collar no vinculado." });
        }

        // --- 2. LÓGICA DE NOTIFICACIÓN POR GEOCERCA ---
    // --- 2. LÓGICA DE NOTIFICACIÓN POR GEOCERCA ---
// Añadimos la validación de geoActive
if (alerta_geocerca === true && mascota.geoActive === true) {
    
    const ahora = new Date();
    // Usamos una propiedad específica para el cooldown de notificaciones
    // para no confundirla con la actualización de posición
    const ultimaAlerta = mascota.ultimaAlerta || 0;
    const tiempoTranscurrido = ahora - ultimaAlerta;
    const cooldown = 60 * 600; // 1 minuto para no saturar

    if (tiempoTranscurrido > cooldown) {
        console.log(`🚨 ¡ESCAPE CONFIRMADO! ${mascota.nombre} está fuera y la geocerca está ACTIVA.`);
        
        if (mascota.usuario && mascota.usuario.pushToken) {
          const payloadGeocerca = {
    notification: {
        title: `🚨 ¡ALERTA: ${mascota.nombre} SE ESCAPÓ!`,
        body: `Tu mascota salió del perímetro. Toca para localizarla.`,
    },
    data: {
        mascotaId: mascota._id.toString(),
        tipo: "ALERTA_GEOCERCA",
        lat: lat.toString(),
        lng: lng.toString()
    },
    // AQUÍ ES DONDE VAN LOS CANALES Y LA CONFIGURACIÓN DE ANDROID
    android: {
        priority: "high",
        notification: {
            channelId: "alertas_criticas", // <-- Se escribe channelId (sin android_)
            color: "#FF0000",
            sound: "default",
            
        }
    },
    token: mascota.usuario.pushToken
};
            try {
                console.log("ID del Proyecto en Admin:", admin.app().options.credential.projectId);
console.log("Enviando al token:", mascota.usuario.pushToken.substring(0, 10) + "...");
                await admin.messaging().send(payloadGeocerca);
                
                // IMPORTANTE: Guardamos la hora de ESTA alerta específica
                await Mascota.findByIdAndUpdate(mascota._id, { 
                    ultimaAlerta: ahora 
                });
                
                console.log("🚀 Notificación enviada");
            } catch (error) {
                console.error("❌ Error al enviar push:", error);
            }
        }
    } else {
        console.log("⏳ Notificación omitida por cooldown (1 min).");
    }
} else if (alerta_geocerca === true && !mascota.geoActive) {
    console.log("ℹ️ El ESP32 detectó salida, pero la geocerca está DESACTIVADA en la app. No se envía push.");
}

        // --- 3. LÓGICA DE NOTIFICACIÓN POR LADRIDO (Ya la tenías) ---
        if (ladrido === true) {
            // ... tu código actual de notificación por ladrido ...
            if (mascota.usuario && mascota.usuario.pushToken) {
                const payloadLadrido = {
                    notification: {
                        title: `⚠️ Alerta de Ruido: ${mascota.nombre}`,
                        body: "Se han detectado ladridos o ruidos fuertes cerca de tu mascota.",
                    },
                    data: {
                        mascotaId: mascota._id.toString(),
                        tipo: "ALERTA_RUIDO"
                    },
                    token: mascota.usuario.pushToken
                };
                try {
                    await admin.messaging().send(payloadLadrido);
                } catch (e) { console.error(e); }
            }
        }

        if (tieneGpsValido) {
            await Historial.create({
                mascotaId: mascota._id,
                clienteId: mascota.usuario._id, 
                lat: lat,
                lng: lng,
                fecha: ahora
            });
        }

        // 4. RESPUESTA AL ESP32 (Mantenemos tus campos actuales)
        res.json({ 
            ok: true,
            vinculado: true,
            sos: mascota.sos || false,
            intervalo: mascota.intervalo || 15000,
            buzzer: mascota.buzzer || 'off',
            geoActive: mascota.geoActive || false,
            geoLat: mascota.geoLat || 0,
            geoLng: mascota.geoLng || 0,
            geoRadio: mascota.geoRadio || 100
        });

    } catch (error) {
        console.error("❌ Error Crítico en GPS:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
};
exports.desvincularDispositivo = async (req, res) => {
    const { idMascota } = req.params;

    try {
        // 1. Buscamos la mascota para saber qué collar tiene asignado
        const mascota = await Mascota.findById(idMascota);
        
        if (!mascota || !mascota.collarId) {
            return res.status(404).json({ ok: false, msg: "La mascota no tiene un collar vinculado" });
        }

        const macDelCollar = mascota.collarId;

        // 2. LIMPIEZA EN EL COLLAR
        // Usamos $unset para eliminar el campo 'mascotaActual' por completo
        await Collar.findOneAndUpdate(
            { collarId: macDelCollar }, 
            { 
                $unset: { mascotaActual: "" }, // Elimina el campo para que no choque el índice unique
                $set: { estado: "disponible" } 
            }
        );

        // 3. LIMPIEZA EN LA MASCOTA
        // Usamos $unset para eliminar 'collarId' y evitar el error E11000 de duplicados null
        const mascotaActualizada = await Mascota.findByIdAndUpdate(
            idMascota,
            { 
                $unset: { collarId: "" }, // Elimina la referencia por completo
                $set: { ladrido: false } 
            },
            { new: true }
        );

        console.log(`✅ Desvinculación exitosa: Collar ${macDelCollar} libre.`);

        res.json({
            ok: true,
            msg: "Collar desvinculado correctamente",
            mascota: mascotaActualizada
        });

    } catch (error) {
        console.error("❌ Error al desvincular:", error);
        res.status(500).json({ ok: false, msg: "Error inesperado al desvincular", error: error.message });
    }
};

exports.actualizarApodo = async (req, res) => {
    try {
        const { idCollar } = req.params;
        const { nuevoApodo } = req.body;

        const collar = await Collar.findByIdAndUpdate(
            idCollar, 
            { apodo: nuevoApodo }, 
            { new: true }
        );

        if (!collar) return res.status(404).json({ ok: false, msg: 'Collar no encontrado' });

        res.json({ ok: true, msg: 'Apodo actualizado correctamente', collar });
    } catch (error) {
        res.status(500).json({ ok: false, msg: 'Error al actualizar el apodo' });
    }
};