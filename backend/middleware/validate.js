// ==========================================
// Importaciones
// ==========================================
const { body, validationResult } = require('express-validator');


// ==========================================
// Middleware: Verificador genérico de validación
// ==========================================

// Verifica si express-validator detectó errores.
// Si los hay, los devuelve al cliente con status 400.
const verificarValidacion = (req, res, next) => {
  const errores = validationResult(req);
  
  if (!errores.isEmpty()) {
    const listaErrores = errores.array().map(err => ({
      campo: err.path,
      mensaje: err.msg
    }));
    
    return res.status(400).json({
      message: 'Errores de validación',
      errores: listaErrores
    });
  }
  
  next();
};


// ==========================================
// Reglas de Validación por Endpoint
// ==========================================

// Validaciones para el inicio de sesión
const validarLogin = [
  body('documento')
    .notEmpty()
    .withMessage('El documento es obligatorio')
    .isLength({ min: 3 })
    .withMessage('El documento debe tener al menos 3 caracteres'),
    
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
    
  verificarValidacion
];

// Validaciones para la creación de usuarios
const validarCreacionUsuario = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isAlpha('es-ES', { ignore: ' ' })
    .withMessage('El nombre solo debe contener letras'),
    
  body('apellido')
    .notEmpty()
    .withMessage('El apellido es obligatorio')
    .isAlpha('es-ES', { ignore: ' ' })
    .withMessage('El apellido solo debe contener letras'),
    
  body('documento')
    .notEmpty()
    .withMessage('El documento es obligatorio')
    .isAlphanumeric()
    .withMessage('El documento solo debe contener letras y números'),
    
  body('email')
    .isEmail()
    .withMessage('Debe ingresar un correo electrónico válido'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número'),
    
  body('rol')
    .isIn(['alumno', 'profesor', 'admin'])
    .withMessage('El rol debe ser alumno, profesor o admin'),
    
  verificarValidacion
];

// Validaciones para la creación de observaciones
const validarCreacionObservacion = [
  body('alumno')
    .notEmpty()
    .withMessage('El ID del alumno es obligatorio')
    .isMongoId()
    .withMessage('El ID del alumno no tiene un formato válido'),
    
  body('tipo')
    .isIn(['felicitacion', 'atencion', 'compromiso', 'nota'])
    .withMessage('El tipo debe ser felicitacion, atencion, compromiso o nota'),
    
  body('categoria')
    .isIn(['convivencia', 'academico', 'puntualidad', 'cuidado'])
    .withMessage('La categoría no es válida'),
    
  body('descripcion')
    .isLength({ min: 10 })
    .withMessage('La descripción debe tener al menos 10 caracteres'),
    
  body('fechaHecho')
    .notEmpty()
    .withMessage('La fecha del hecho es obligatoria')
    .isISO8601()
    .withMessage('La fecha debe tener formato ISO 8601 válido'),
    
  verificarValidacion
];


// ==========================================
// Exportación
// ==========================================
module.exports = {
  validarLogin,
  validarCreacionUsuario,
  validarCreacionObservacion,
  verificarValidacion
};