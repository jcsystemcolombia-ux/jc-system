const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

const registro = async (req, res) => {
  try {
    const { nombre, email, password, telefono, rol } = req.body

    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email }
    })

    if (usuarioExiste) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' })
    }

    const passwordEncriptada = await bcrypt.hash(password, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: passwordEncriptada,
        telefono,
        rol: rol || 'cliente'
      }
    })

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const usuario = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!usuario) {
      return res.status(400).json({ mensaje: 'Credenciales incorrectas' })
    }

    const passwordValida = await bcrypt.compare(password, usuario.password)

    if (!passwordValida) {
      return res.status(400).json({ mensaje: 'Credenciales incorrectas' })
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión', error: error.message })
  }
}

module.exports = { registro, login }