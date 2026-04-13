const admin = require("firebase-admin");
const serviceAccount = require("./firebase-account.json"); // Asegúrate que la ruta sea correcta

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("🔥 Firebase Admin inicializado correctamente");

module.exports = admin;