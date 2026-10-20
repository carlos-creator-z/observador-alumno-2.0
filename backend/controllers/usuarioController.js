// ==========================================
// Eliminación de Usuarios (Borrado Lógico)
// ==========================================

// Eliminar usuario mediante borrado lógico.
// Se cambia el campo 'activo' a false para preservar
// la integridad referencial de las observaciones ya registradas.
exports.deleteUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.id;
    
    // Buscar y desactivar al usuario
    const usuario = await Usuario.findByIdAndUpdate(
      usuarioId,
      { activo: false },
      { new: true }
    ).select('-password');
    
    // Validar que el usuario exista
    if (!usuario) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Prevenir la eliminación del administrador principal
    if (usuario.documento === 'admin001') {
      return res.status(403).json({ 
        message: 'No se puede desactivar al administrador principal' 
      });
    }
    
    res.json({ 
      message: 'Usuario desactivado correctamente',
      usuario 
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al desactivar usuario', 
      error: error.message 
    });
  }
};