// ==========================================
// Importaciones
// ==========================================
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');


// ==========================================
// Middlewares de Autenticación
// ==========================================

// Proteger rutas: Verifica que el usuario tenga un token JWT válido
exports.protect = async (req, res, next) => {
  let token;

  // 1. Verificar si el header Authorization existe y comienza con "Bearer"
  if (
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extraer el token (eliminar la palabra "Bearer " del string)
      token = req.headers.authorization.split(' ')[1];

      // 3. Verificar la firma y validez del token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Buscar el usuario en la BD usando el ID del token
      // Se excluye el campo password por seguridad
      req.user = await Usuario.findById(decoded.id).select('-password');

      // 5. Validar que el usuario aún exista en la base de datos
      if (!req.user) {
        return res.status(401).json({ message: 'Token no válido' });
      }

      // 6. Todo correcto, continuar a la siguiente función o controlador
      next();

    } catch (error) {
      // Error si el token ha expirado o la firma no coincide
      res.status(401).json({ message: 'Token expirado o no válido' });
    }
  } else {
    // Error si no se envió ningún token en la petición
    res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};