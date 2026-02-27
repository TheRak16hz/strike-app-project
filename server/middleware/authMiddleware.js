const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Obtener token del header
  const token = req.header('Authorization');

  // Comprobar si no hay token
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }

  // Verificar el token
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secretSuperSeguroToken123');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token no es válido' });
  }
};
