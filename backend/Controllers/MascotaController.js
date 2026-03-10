const Mascota = require('../models/Mascota');

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