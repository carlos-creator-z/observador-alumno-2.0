exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: `El rol ${req.user.rol} no tiene permiso` });
    }
    next();
  };
};