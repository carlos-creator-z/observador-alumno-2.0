const mongoose = require('mongoose');

const observacionSchema = new mongoose.Schema({
  alumno: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: { type: String, required: true },
  categoria: { type: String, required: true },
  descripcion: { type: String, required: true },
  fechaHecho: { type: Date, required: true },
  status: { type: String, default: 'pendiente' },
  descargo: { type: String, default: null },
  signedAt: { type: Date, default: null },
  // Nuevos campos para firmas (se guardan como imágenes Base64)
  firmaAlumno: { type: String, default: null },
  firmaDocente: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Observacion', observacionSchema);