require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/db');
const Mascota = require('./models/Mascota');
const app = express();

const http = require('http');
const { Server } = require('socket.io');


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // En producción pon la URL de tu app
    methods: ["GET", "POST"]
  }
});

// Cuando un GPS o un simulador envía coordenadas vía Socket o HTTP
app.post('/update-location', (req, res) => {
  const { petId, lat, lng } = req.body;
  
  // Emitimos el movimiento a todos los celulares escuchando esa mascota
  io.emit(`position-${petId}`, { lat, lng });
  
  res.status(200).send('Ubicación actualizada');
});

// Ruta temporal para simular que un collar GPS se está moviendo
app.get('/simular-mascota/:id', async (req, res) => {
    const petId = req.params.id;

    try {
        // 1. Buscamos la mascota en la base de datos para saber su posición actual
        const mascota = await Mascota.findById(petId);

        if (!mascota) {
            return res.status(404).send('Mascota no encontrada');
        }

        // 2. Usamos sus coordenadas reales de inicio
        let lat = mascota.lat;
        let lng = mascota.lng;

        console.log(`📡 Iniciando simulación para ${mascota.nombre} desde su última ubicación.`);

        const intervalo = setInterval(async () => {
            lat += 0.0001; 
            lng += 0.0001;

            const dataNueva = {
                petId: petId,
                lat: lat,
                lng: lng,
                bateria: Math.floor(Math.random() * (100 - 80) + 80) // Simular batería entre 80 y 100
            };

            // 3. EMITIMOS AL MAPA
            io.emit('posicion-actualizada', dataNueva);

            // 4. OPCIONAL: Actualizamos la base de datos para que el cambio sea permanente
            // Si no haces esto, al recargar la app la mascota volverá al inicio original.
            await Mascota.findByIdAndUpdate(petId, { lat, lng });

            console.log(`📍 ${mascota.nombre} moviéndose a: ${lat}, ${lng}`);
        }, 2000);

        setTimeout(() => {
            clearInterval(intervalo);
            console.log(`🛑 Simulación finalizada para ${mascota.nombre}`);
        }, 60000);

        res.send(`Simulación iniciada para ${mascota.nombre}. Empezando en ${lat}, ${lng}`);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error al iniciar simulación');
    }
});

io.on('connection', (socket) => {
  console.log('Usuario conectado al socket:', socket.id);
});

server.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));

// Conectar a la base de datos
conectarDB();

// Middlewares
app.use(cors()); // Permite que Ionic se conecte desde cualquier IP
app.use(express.json());

// Definir Rutas
app.use('/api/auth', require('./Routes/AuthRoutes'));
app.use('/api/mascotas', require('./Routes/mascotasRouter'));

app.get('/api/test', (req, res) => {
    res.json({ msg: "El servidor está vivo y responde" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor profesional en puerto ${PORT}`));