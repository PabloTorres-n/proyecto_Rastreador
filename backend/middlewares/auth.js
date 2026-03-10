const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Buscamos el token en el header 'x-auth-token' o 'Authorization'
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. No hay token.' });
  }

  try {
    // Verificamos el token con la misma palabra secreta del modelo
    const cifrado = jwt.verify(token, 'PalabraSecreta_AtjaYaala_2024');
    req.user = cifrado; // Guardamos los datos del usuario en la request
    next(); // ¡Pasa al siguiente paso (el controlador)!
  } catch (ex) {
    res.status(400).json({ mensaje: 'Token no válido o expirado.' });
  }
};