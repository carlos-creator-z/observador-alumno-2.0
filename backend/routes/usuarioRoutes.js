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
  getAlumnos, 
  createUsuario, 
  getAllUsers, 
  getProfesores, 
  asignarGrados 
} = require('../controllers/usuarioController');


// ==========================================
// Definición de Rutas (/api/usuarios)
// ==========================================

// --- Gestión de Alumnos ---
// Obtener alumnos (filtrado por grados si es profesor)
router.get(
  '/alumnos', 
  protect, 
  authorize('profesor', 'admin'), 
  getAlumnos
);

// Obtener todos los alumnos (Para vista de grados en Admin)
router.get(
  '/all', 
  protect, 
  authorize('admin'), 
  getAllUsers
);

// --- Gestión de Profesores y Grados ---
// Obtener todos los profesores
router.get(
  '/profesores', 
  protect, 
  authorize('admin'), 
  getProfesores
);

// Asignar grados a un profesor específico
router.put(
  '/profesores/:id/grados', 
  protect, 
  authorize('admin'), 
  asignarGrados
);

// --- Creación de Usuarios ---
// Crear nuevo usuario (Alumno o Profesor)
router.post(
  '/', 
  protect, 
  authorize('admin'), 
  createUsuario
);


// ==========================================
// Exportación
// ==========================================
module.exports = router;