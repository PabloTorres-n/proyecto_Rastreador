require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('../config/db'); // Ajusta la ruta según tu carpeta
const Mascota = require('../models/Mascota');
const Usuario =require('../models/Cliente');
const app = express();
require('../firebase-config');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar a la DB (IMPORTANTE: Vercel conecta en cada petición)
conectarDB();

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configura tus credenciales
cloudinary.config({ 
  cloud_name: 'dw94vvhxh', 
  api_key: '732715184575831', 
  api_secret: 'A-4i5Z9GF-vxwopfSP_enFF5EDw' 
});

// Configura cómo se guardarán las fotos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mascotas', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
  
});

const upload = multer({ storage: storage });

// --- RUTAS ---

// 1. La que usará la LilyGO (El Collar)

app.get('/api/test', (req, res) => {
    res.json({ msg: "El servidor está vivo" });
});

// Ruta de actualización (PUT o POST /api/mascotas/:id/foto)
// --- Al principio de tu archivo, asegúrate de tener esto ---


// --- Sustituye tu ruta POST de la foto por esta ---
// Añade esta lógica dentro de tu ruta POST /api/mascotas/:id/foto
app.post('/api/mascotas/:id/foto', upload.single('foto'), async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar la mascota actual para ver si ya tiene una foto
        const mascotaAnterior = await Mascota.findById(id);
        
        if (mascotaAnterior && mascotaAnterior.foto_url) {
            try {
                // Extraer el Public ID de la URL vieja
                // Ejemplo URL: https://res.cloudinary.com/demo/image/upload/v157/mascotas/perro123.jpg
                // El Public ID sería: mascotas/perro123
                const urlParts = mascotaAnterior.foto_url.split('/');
                const fileName = urlParts[urlParts.length - 1].split('.')[0];
                const folderName = urlParts[urlParts.length - 2];
                const publicId = `${folderName}/${fileName}`;

                // Borrar la imagen vieja en Cloudinary
                await cloudinary.uploader.destroy(publicId);
                console.log("Foto anterior eliminada de Cloudinary:", publicId);
            } catch (err) {
                console.error("Error al borrar foto vieja (quizás no existía):", err);
            }
        }

        // 2. Si no hay archivo nuevo en la petición, paramos aquí
        if (!req.file) {
            return res.status(400).json({ ok: false, message: "No se subió foto nueva" });
        }

        // 3. Guardar la URL de la foto NUEVA (que ya subió multer-storage-cloudinary)
        const nuevaFotoUrl = req.file.path;

        const mascotaActualizada = await Mascota.findByIdAndUpdate(
            id,
            { $set: { foto_url: nuevaFotoUrl } },
            { new: true }
        );

        res.json({
            ok: true,
            mensaje: "Foto actualizada y anterior eliminada",
            foto_url: nuevaFotoUrl
        });

    } catch (error) {
        console.error("Error en la actualización:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Ruta en tu backend de Express (Vercel)
// Asegúrate de tener importado el modelo Usuario y la configuración de Cloudinary/Multer

app.post('/api/clientes/:id/foto', upload.single('foto'), async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar al usuario actual para verificar si ya tiene una foto previa
        const usuarioAnterior = await Usuario.findById(id);
        
        if (!usuarioAnterior) {
            return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
        }

        // 2. Si ya tenía foto, la borramos de Cloudinary para ahorrar espacio
        if (usuarioAnterior.foto_url) {
            try {
                // Extraemos el Public ID (igual que con las mascotas)
                const urlParts = usuarioAnterior.foto_url.split('/');
                const fileName = urlParts[urlParts.length - 1].split('.')[0];
                const folderName = urlParts[urlParts.length - 2];
                const publicId = `${folderName}/${fileName}`;

                await cloudinary.uploader.destroy(publicId);
                console.log("Foto de perfil anterior eliminada:", publicId);
            } catch (err) {
                console.error("Error al borrar foto de perfil vieja:", err);
            }
        }

        // 3. Validar que Multer haya procesado el nuevo archivo
        if (!req.file) {
            return res.status(400).json({ ok: false, message: "No se recibió ninguna imagen" });
        }

        // 4. Actualizar el campo foto_url en el Usuario
        const nuevaFotoUrl = req.file.path; // URL que genera multer-storage-cloudinary

        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            id,
            { $set: { foto_url: nuevaFotoUrl } },
            { new: true } // Para que devuelva el documento ya modificado
        );

        res.json({
            ok: true,
            mensaje: "Foto de perfil actualizada correctamente",
            foto_url: nuevaFotoUrl,
            usuario: {
                nombre: usuarioActualizado.nombre,
                correo: usuarioActualizado.correo,
                foto_url: usuarioActualizado.foto_url
            }
        });

    } catch (error) {
        console.error("Error al actualizar foto de usuario:", error);
        res.status(500).json({ 
            ok: false, 
            message: "Error interno del servidor", 
            error: error.message 
        });
    }
});
// 2. La que usará tu App de Celular (Ionic) para ver el mapa
// app.get('/api/mascotas/:id', async (req, res) => {
//     try {
//         const mascota = await Mascota.findById(req.params.id);
//         res.json(mascota);
//     } catch (error) {
//         res.status(500).send('Error al obtener mascota');
//     }
// });
// Ruta temporal: midominio.com/api/mascotas/fix-database

// Rutas de tus otros archivos
app.use('/api/auth', require('../Routes/AuthRoutes'));
app.use('/api/mascotas', require('../Routes/mascotasRouter'));
app.use('/api/clientes', require('../Routes/clientesRoute'));
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Aquí verás el texto real del error en los logs de Vercel
});
// IMPORTANTE PARA VERCEL: No uses app.listen()
module.exports = app;