require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/db');

const app = express();

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