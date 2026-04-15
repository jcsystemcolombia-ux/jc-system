const prisma = require('../config/prisma')
const bcrypt = require('bcryptjs')

const listarClientes = async (req, res) => {
  try {
    const clientes = await prisma.usuario.findMany({
      where: {
        rol: { in: ['cliente', 'subcliente'] }
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        nitCedula: true,
        direccion: true,
        direccionAdicional: true,
        rol: true,
        recibeNotificaciones: true,
        clientePrincipalId: true,
        clientePrincipal: {
          select: {
            id: true,
            nombre: true
          }
        },
        subClientes: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true
          }
        },
        empresaId: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            nit: true
          }
        },
        createdAt: true
      }
    })
    res.json(clientes)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar clientes', error: error.message })
  }
}

const obtenerCliente = async (req, res) => {
  try {
    const { id } = req.params
    const cliente = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        nitCedula: true,
        direccion: true,
        direccionAdicional: true,
        rol: true,
        recibeNotificaciones: true,
        clientePrincipalId: true,
        clientePrincipal: {
          select: {
            id: true,
            nombre: true
          }
        },
        subClientes: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true
          }
        },
        empresaId: true,
        empresa: {
          select: {
            id: true,
            nombre: true,
            nit: true
          }
        },
        createdAt: true,
        servicios: true,
        cuentasCobro: true,
        citas: true
      }
    })

    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' })
    }

    res.json(cliente)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener cliente', error: error.message })
  }
}

const crearCliente = async (req, res) => {
  try {
    const { nombre, email, password, telefono, nitCedula, direccion, direccionAdicional, clientePrincipalId, empresaId } = req.body

    if (!direccion) {
      return res.status(400).json({ mensaje: 'La dirección es obligatoria' })
    }

    const existeEmail = await prisma.usuario.findUnique({ where: { email } })
    if (existeEmail) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' })
    }

    const passwordEncriptada = await bcrypt.hash(password, 10)
    const rol = clientePrincipalId ? 'subcliente' : 'cliente'

    const cliente = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: passwordEncriptada,
        telefono,
        nitCedula,
        direccion,
        direccionAdicional,
        rol,
        clientePrincipalId: clientePrincipalId ? parseInt(clientePrincipalId) : null,
        empresaId: empresaId ? parseInt(empresaId) : null
      }
    })

    res.status(201).json({
      mensaje: 'Cliente creado exitosamente',
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        nitCedula: cliente.nitCedula,
        direccion: cliente.direccion,
        direccionAdicional: cliente.direccionAdicional,
        rol: cliente.rol,
        clientePrincipalId: cliente.clientePrincipalId,
        empresaId: cliente.empresaId
      }
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear cliente', error: error.message })
  }
}

const editarCliente = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, email, telefono, nitCedula, direccion, direccionAdicional, clientePrincipalId, empresaId, rol } = req.body

    if (!direccion) {
      return res.status(400).json({ mensaje: 'La dirección es obligatoria' })
    }

    const cliente = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        email,
        telefono,
        nitCedula,
        direccion,
        direccionAdicional,
        clientePrincipalId: clientePrincipalId ? parseInt(clientePrincipalId) : null,
        empresaId: empresaId ? parseInt(empresaId) : null
      }
    })

    res.json({
      mensaje: 'Cliente actualizado exitosamente',
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        nitCedula: cliente.nitCedula,
        direccion: cliente.direccion,
        direccionAdicional: cliente.direccionAdicional,
        rol: cliente.rol,
        clientePrincipalId: cliente.clientePrincipalId,
        empresaId: cliente.empresaId
      }
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al editar cliente', error: error.message })
  }
}

const toggleNotificaciones = async (req, res) => {
  try {
    const { id } = req.params
    const cliente = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      select: { recibeNotificaciones: true }
    })

    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' })
    }

    const actualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { recibeNotificaciones: !cliente.recibeNotificaciones }
    })

    res.json({
      mensaje: `Notificaciones ${actualizado.recibeNotificaciones ? 'activadas' : 'desactivadas'} exitosamente`,
      recibeNotificaciones: actualizado.recibeNotificaciones
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar notificaciones', error: error.message })
  }
}

module.exports = { listarClientes, obtenerCliente, crearCliente, editarCliente, toggleNotificaciones }