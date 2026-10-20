// ==========================================
// Importaciones
// ==========================================
const mongoose = require('mongoose');


// ==========================================
// Definición del Esquema de Observación
// ==========================================
const observacionSchema = new mongoose.Schema({
  
  // --- Referencias (Relaciones entre usuarios) ---
  alumno: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },
  registradoPor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', 
    required: true 
  },

  // --- Detalles del Hecho ---
  tipo: { 
    type: String, 
    enum: ['felicitacion', 'atencion', 'compromiso', 'nota'],
    required: true 
  },
  categoria: { 
    type: String, 
    enum: ['convivencia', 'academico', 'puntualidad', 'cuidado'],
    required: true 
  },
  descripcion: { 
    type: String, 
    required: true,
    minlength: 10
  },
  fechaHecho: { 
    type: Date, 
    required: true 
  },

  // --- Estado y Descargos ---
  status: { 
    type: String, 
    enum: ['pendiente', 'firmado'],
    default: 'pendiente' 
  },
  descargo: { 
    type: String, 
    default: null 
  },
  signedAt: { 
    type: Date, 
    default: null 
  },

  // --- Firmas Digitales (Imágenes en formato Base64) ---
  firmaAlumno: { 
    type: String, 
    default: null 
  },
  firmaDocente: { 
    type: String, 
    default: null 
  }
  
}, { 
  timestamps: true 
});


// ==========================================
// Índices para Optimización de Consultas
// ==========================================

// Índice compuesto para acelerar la consulta del panel del alumno
// (observaciones de un alumno ordenadas por fecha de creación)
observacionSchema.index({ alumno: 1, createdAt: -1 });

// Índice para acelerar la consulta del panel del profesor
// (observaciones realizadas por un profesor)
observacionSchema.index({ registradoPor: 1, createdAt: -1 });

// Índice para acelerar el filtrado por estado en el panel del admin
observacionSchema.index({ status: 1, createdAt: -1 });


// ==========================================
// Exportación del Modelo
// ==========================================
module.exports = mongoose.model('Observacion', observacionSchema);