const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await Usuario.findById(decoded.id).select('-password');
      if (!req.user) return res.status(401).json({ message: 'Token no válido' });
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token expirado o no válido' });
    }
  } else {
    res.status(401).json({ message: 'No autorizado, no hay token' });
  }
};