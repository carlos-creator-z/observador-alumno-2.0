// ==========================================
// Importaciones
// ==========================================
const express = require('express');
const router = express.Router();

// Middlewares de seguridad
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Middleware de validación
const { validarCreacionObservacion } = require('../middleware/validate');

// Controladores
const { 
  createObservacion, 
  getMyObservaciones, 
  getMyRegistros,
  firmarObservacion, 
  getAllObservaciones, 
  generarPDF 
} = require('../controllers/observacionController');


// ==========================================
// Rutas de Creación de Observaciones
// ==========================================

// Crear nueva observación (con validación previa)
router.post(
  '/', 
  protect, 
  authorize('profesor', 'admin'), 
  validarCreacionObservacion, 
  createObservacion
);


// ==========================================
// Rutas de Consulta de Observaciones
// ==========================================

// Ver todas las observaciones del sistema (Solo admin)
router.get(
  '/', 
  protect, 
  authorize('admin'), 
  getAllObservaciones
);

// Ver observaciones propias (Alumno)
router.get(
  '/mis-observaciones', 
  protect, 
  authorize('alumno'), 
  getMyObservaciones
);

// Ver observaciones realizadas (Profesor/Admin)
router.get(
  '/mis-registros', 
  protect, 
  authorize('profesor', 'admin'), 
  getMyRegistros
);

// Descargar PDF físico de una observación
router.get(
  '/pdf/:id', 
  protect, 
  generarPDF
);


// ==========================================
// Rutas de Actualización de Observaciones
// ==========================================

// Firmar observación y agregar descargos (Alumno)
router.patch(
  '/firmar/:id', 
  protect, 
  authorize('alumno'), 
  firmarObservacion
);


// ==========================================
// Exportación
// ==========================================
module.exports = router;