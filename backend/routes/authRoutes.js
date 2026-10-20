// ==========================================
// Importaciones
// ==========================================
const express = require('express');
const router = express.Router();

const { setup, login } = require('../controllers/authController');
const { validarLogin } = require('../middleware/validate');


// ==========================================
// Rutas de Autenticación
// ==========================================

// Inicializar el sistema y crear el administrador principal
router.post('/setup', setup);

// Iniciar sesión con validación previa de credenciales
router.post(
  '/login',
  validarLogin,
  login
);


// ==========================================
// Exportación
// ==========================================
module.exports = router;