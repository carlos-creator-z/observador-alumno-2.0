// ==========================================
// Importaciones
// ==========================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


// ==========================================
// Definición del Esquema de Usuario
// ==========================================
const usuarioSchema = new mongoose.Schema({
  
  // --- Información Personal ---
  nombre: { 
    type: String, 
    required: true 
  },
  apellido: { 
    type: String, 
    required: true 
  },
  documento: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  // --- Seguridad y Credenciales ---
  // select: false evita que la contraseña se devuelva en las consultas por defecto
  password: { 
    type: String, 
    required: true, 
    select: false 
  },

  // --- Roles y Asignaciones Académicas ---
  rol: { 
    type: String, 
    enum: ['alumno', 'profesor', 'admin'], 
    required: true 
  },
  grado: { 
    type: String, 
    default: null // Aplica solo para alumnos
  },
  grados: [{ 
    type: String 
  }], // Arreglo para profesores (ej: ["10A", "11B"])

  // --- Estado de la Cuenta ---
  activo: { 
    type: Boolean, 
    default: true 
  }
});


// ==========================================
// Middlewares (Hooks) de Mongoose
// ==========================================

// Hashear la contraseña antes de guardarla en la base de datos
usuarioSchema.pre('save', async function(next) {
  // Si el password no ha sido modificado, no lo vuelvas a hashear
  if (!this.isModified('password')) return next();
  
  // Generar el hash con un salt de 10 rondas
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


// ==========================================
// Métodos de Instancia
// ==========================================

// Comparar la contraseña ingresada por el usuario con el hash almacenado
usuarioSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// ==========================================
// Exportación del Modelo
// ==========================================
module.exports = mongoose.model('Usuario', usuarioSchema);