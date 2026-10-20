// ==========================================
// Importaciones
// ==========================================
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validarCreacionUsuario } = require('../middleware/validate');

const { 
  getAlumnos, 
  createUsuario, 
  getAllUsers, 
  getProfesores, 
  asignarGrados,
  deleteUsuario  // <-- NUEVO
} = require('../controllers/usuarioController');


// ==========================================
// Rutas
// ==========================================

router.get('/alumnos', protect, authorize('profesor', 'admin'), getAlumnos);
router.get('/all', protect, authorize('admin'), getAllUsers);
router.get('/profesores', protect, authorize('admin'), getProfesores);
router.put('/profesores/:id/grados', protect, authorize('admin'), asignarGrados);

// Crear usuario con validación previa
router.post('/', protect, authorize('admin'), validarCreacionUsuario, createUsuario);

// Eliminar usuario (borrado lógico) - NUEVO
router.delete('/:id', protect, authorize('admin'), deleteUsuario);


module.exports = router;