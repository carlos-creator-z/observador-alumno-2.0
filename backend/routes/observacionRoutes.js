// ==========================================
// Importaciones
// ==========================================
const express = require('express');
const router = express.Router();

// Middlewares de seguridad
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

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
// Definición de Rutas (/api/observaciones)
// ==========================================

// --- Creación ---
// Crear nueva observación (Solo profesores o admin)
router.post(
  '/', 
  protect, 
  authorize('profesor', 'admin'), 
  createObservacion
);

// --- Lectura ---
// Ver todas las observaciones del sistema (Solo admin)
router.get(
  '/', 
  protect, 
  authorize('admin'), 
  getAllObservaciones
);

// Ver observaciones propias del alumno logueado
router.get(
  '/mis-observaciones', 
  protect, 
  authorize('alumno'), 
  getMyObservaciones
);

// Ver observaciones realizadas por el profesor/admin logueado
router.get(
  '/mis-registros', 
  protect, 
  authorize('profesor', 'admin'), 
  getMyRegistros
);

// Descargar PDF físico de una observación (Accesible para cualquier rol logueado)
router.get(
  '/pdf/:id', 
  protect, 
  generarPDF
);

// --- Actualización ---
// Firmar observación y agregar descargos (Solo el alumno dueño)
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