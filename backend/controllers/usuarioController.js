// ==========================================
// Importaciones
// ==========================================
const Usuario = require('../models/Usuario');


// ==========================================
// Gestión de Alumnos
// ==========================================

// Obtener alumnos (Filtrado por grados asignados si es profesor)
exports.getAlumnos = async (req, res) => {
  try {
    const query = { rol: 'alumno', activo: true };
    
    // Si el usuario es profesor, filtrar por los grados que tiene asignados
    if (req.user.rol === 'profesor' && req.user.grados && req.user.grados.length > 0) {
      query.grado = { $in: req.user.grados };
    }

    const alumnos = await Usuario.find(query)
      .select('nombre apellido documento grado');
      
    res.json(alumnos);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Obtener todos los alumnos para vista de grados (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Usuario.find({ rol: 'alumno' })
      .select('nombre apellido documento grado');
      
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};


// ==========================================
// Gestión de Profesores y Grados
// ==========================================

// Obtener todos los profesores (Admin)
exports.getProfesores = async (req, res) => {
  try {
    const profesores = await Usuario.find({ rol: 'profesor' })
      .select('nombre apellido documento grados');
      
    res.json(profesores);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Asignar grados a un profesor (Admin)
exports.asignarGrados = async (req, res) => {
  try {
    // Se espera un arreglo de strings, ej: ["10A", "11B"]
    const { grados } = req.body; 
    
    const profesor = await Usuario.findByIdAndUpdate(
      req.params.id, 
      { grados: grados }, 
      { new: true }
    ).select('-password');
    
    if (!profesor) {
      return res.status(404).json({ message: 'Profesor no encontrado' });
    }
    
    res.json(profesor);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};


// ==========================================
// Creación de Usuarios
// ==========================================

// Crear usuario (Admin)
exports.createUsuario = async (req, res) => {
  try {
    const { 
      nombre, 
      apellido, 
      documento, 
      email, 
      password, 
      rol, 
      grado 
    } = req.body;

    const nuevo = await Usuario.create({ 
      nombre, 
      apellido, 
      documento, 
      email, 
      password, 
      rol, 
      // Si es alumno, se asigna el grado; si no, se deja en null
      grado: rol === 'alumno' ? grado : null 
    });
    
    // Limpiar la contraseña antes de devolver la respuesta
    nuevo.password = undefined; 
    
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al crear usuario', 
      error: error.message 
    });
  }
};