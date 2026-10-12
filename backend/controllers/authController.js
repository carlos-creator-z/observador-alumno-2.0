const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Inicializar sistema y crear admin
exports.setup = async (req, res) => {
  if (await Usuario.countDocuments() > 0) return res.status(400).json({ message: 'Ya configurado' });
  await Usuario.create({ nombre: 'Admin', apellido: 'General', documento: 'admin001', email: 'admin@fps.edu.co', password: 'Admin123!', rol: 'admin' });
  res.json({ message: 'Admin creado (admin001 / Admin123!)' });
};

// Login automático (Sin necesidad de seleccionar rol)
exports.login = async (req, res) => {
  try {
    const user = await Usuario.findOne({ documento: req.body.documento }).select('+password');
    if (!user || !(await user.matchPassword(req.body.password))) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign(
      { id: user._id, rol: user.rol, nombre: user.nombre, apellido: user.apellido }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    res.json({ 
      token, 
      user: { id: user._id, nombre: user.nombre, apellido: user.apellido, rol: user.rol } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};