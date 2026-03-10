const axios = require('axios'); 

let lat = 20.6596;
let lng = -103.3496;

console.log("🐕 Iniciando paseo simulado de Firulais...");

function moverPerro() {
    // Mueve al perro un poquito al azar
    lat = lat + (Math.random() - 0.5) * 0.001;
    lng = lng + (Math.random() - 0.5) * 0.001;

    const datosDelCollar = {
        serial: "COLLAR-001",
        lat: lat,
        lng: lng,
        bateria: Math.floor(Math.random() * 100)
    };

    // Manda el dato al servidor
    axios.post('http://localhost:3000/api/ubicacion', datosDelCollar)
        .then(res => {
            console.log(`📡 Coordenada enviada: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        })
        .catch(err => {
            console.error("❌ Error: El servidor (index.js) no responde. ¿Está prendido?");
        });
}

// Repite cada 3 segundos
setInterval(moverPerro, 3000);