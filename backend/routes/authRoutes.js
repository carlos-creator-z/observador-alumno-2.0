// ==========================================
// Importaciones
// ==========================================
const express = require('express');
const router = express.Router();
const { setup, login } = require('../controllers/authController');


// ==========================================
// Rutas de Autenticación
// ==========================================

// Inicializar el sistema y crear el administrador principal
router.post('/setup', setup);

// Iniciar sesión (Login automático según el documento)
router.post('/login', login);


// ==========================================
// Exportación
// ==========================================
module.exports = router;