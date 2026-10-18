// ==========================================
// Importaciones
// ==========================================
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');


// ==========================================
// Controladores de Autenticación
// ==========================================

// Inicializar sistema y crear el administrador principal
exports.setup = async (req, res) => {
  try {
    // Verificar si ya existe algún usuario en la base de datos
    const usuariosCount = await Usuario.countDocuments();

    if (usuariosCount > 0) {
      return res.status(400).json({ 
        message: 'El sistema ya está configurado.' 
      });
    }

    // Crear el administrador por defecto
    await Usuario.create({
      nombre: 'Admin',
      apellido: 'General',
      documento: 'admin001',
      email: 'admin@fps.edu.co',
      password: 'Admin123!',
      rol: 'admin'
    });

    res.status(201).json({ 
      message: 'Admin creado exitosamente (admin001 / Admin123!)' 
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error al inicializar el sistema', 
      error: error.message 
    });
  }
};


// Login automático (Sin necesidad de seleccionar rol manualmente)
exports.login = async (req, res) => {
  try {
    const { documento, password } = req.body;

    // Buscar usuario por documento y traer explícitamente la contraseña
    const user = await Usuario.findOne({ documento }).select('+password');

    // Validar si el usuario existe y la contraseña es correcta
    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ 
        message: 'Credenciales inválidas' 
      });
    }

    // Generar el payload para el JWT
    const payload = {
      id: user._id,
      rol: user.rol,
      nombre: user.nombre,
      apellido: user.apellido
    };

    // Firmar el token con expiración de 8 horas
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Responder con el token y los datos básicos del usuario
    res.json({
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error en el servidor' 
    });
  }
};