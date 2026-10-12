const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { 
  createObservacion, 
  getMyObservaciones, 
  firmarObservacion, 
  getAllObservaciones, 
  getMyRegistros,
  generarPDF // <-- AÑADIDO AQUÍ
} = require('../controllers/observacionController');

router.post('/', protect, authorize('profesor', 'admin'), createObservacion);
router.get('/mis-observaciones', protect, authorize('alumno'), getMyObservaciones);
router.get('/mis-registros', protect, authorize('profesor', 'admin'), getMyRegistros);
router.get('/pdf/:id', protect, generarPDF); // <-- NUEVA RUTA (Accesible para todos los roles logueados)
router.patch('/firmar/:id', protect, authorize('alumno'), firmarObservacion);
router.get('/', protect, authorize('admin'), getAllObservaciones);

module.exports = router;