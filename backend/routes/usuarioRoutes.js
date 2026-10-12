const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getAlumnos, createUsuario, getAllUsers, getProfesores, asignarGrados } = require('../controllers/usuarioController');

router.get('/alumnos', protect, authorize('profesor', 'admin'), getAlumnos);
router.get('/all', protect, authorize('admin'), getAllUsers);
router.get('/profesores', protect, authorize('admin'), getProfesores); // <-- NUEVO
router.put('/profesores/:id/grados', protect, authorize('admin'), asignarGrados); // <-- NUEVO
router.post('/', protect, authorize('admin'), createUsuario);

module.exports = router;