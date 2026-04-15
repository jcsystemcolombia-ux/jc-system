const jwt = require('jsonwebtoken')

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado, token no proporcionado' })
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = verificado
    next()
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido o expirado' })
  }
}

const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado, se requiere rol admin' })
  }
  next()
}

module.exports = { verificarToken, soloAdmin }