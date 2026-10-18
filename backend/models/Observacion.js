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
    required: true 
  },
  categoria: { 
    type: String, 
    required: true 
  },
  descripcion: { 
    type: String, 
    required: true 
  },
  fechaHecho: { 
    type: Date, 
    required: true 
  },

  // --- Estado y Descargos ---
  status: { 
    type: String, 
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
  timestamps: true // Añade automáticamente createdAt y updatedAt
});


// ==========================================
// Exportación del Modelo
// ==========================================
module.exports = mongoose.model('Observacion', observacionSchema);