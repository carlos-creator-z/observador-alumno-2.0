// ==========================================
// Importaciones
// ==========================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();


// ==========================================
// Middlewares Globales
// ==========================================

// Permitir peticiones desde otros dominios (Frontend)
app.use(cors());

// Parsear el cuerpo de las peticiones a formato JSON
app.use(express.json());

// Servir los archivos estáticos del frontend (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../frontend')));


// ==========================================
// Rutas de la API (MVC)
// ==========================================

// Rutas de autenticación (Login, Setup)
app.use('/api/auth', require('./routes/authRoutes'));

// Rutas de gestión de usuarios (Alumnos, Profesores, Admin)
app.use('/api/usuarios', require('./routes/usuarioRoutes'));

// Rutas de observaciones y generación de PDF
app.use('/api/observaciones', require('./routes/observacionRoutes'));


// ==========================================
// Configuración de SPA (Single Page Application)
// ==========================================

// Cualquier ruta que no sea de la API, redirige al index.html del frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});


// ==========================================
// Arranque del Servidor
// ==========================================

// Conectar a la base de datos y luego levantar el servidor
connectDB().then(() => {
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`);
  });
  
}).catch((error) => {
  console.error('Error al conectar con la base de datos:', error.message);
  process.exit(1); // Detener la app si no hay base de datos
});