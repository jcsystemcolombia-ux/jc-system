const prisma = require('../config/prisma')
const { notificarCitaCreada, notificarCitaConfirmada, notificarCitaCancelada, notificarCitaCompletada } = require('../services/notificaciones')

const listarCitas = async (req, res) => {
  try {
    const citas = await prisma.cita.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            direccion: true
          }
        }
      },
      orderBy: { fecha: 'asc' }
    })
    res.json(citas)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar citas', error: error.message })
  }
}

const listarCitasPendientes = async (req, res) => {
  try {
    const citas = await prisma.cita.findMany({
      where: { estado: 'pendiente' },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            direccion: true
          }
        }
      },
      orderBy: { fecha: 'asc' }
    })
    res.json(citas)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar citas pendientes', error: error.message })
  }
}

const listarCitasPorCliente = async (req, res) => {
  try {
    const { usuarioId } = req.params
    const citas = await prisma.cita.findMany({
      where: { usuarioId: parseInt(usuarioId) },
      orderBy: { fecha: 'asc' }
    })
    res.json(citas)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar citas del cliente', error: error.message })
  }
}

const obtenerCita = async (req, res) => {
  try {
    const { id } = req.params
    const cita = await prisma.cita.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            direccion: true
          }
        }
      }
    })

    if (!cita) {
      return res.status(404).json({ mensaje: 'Cita no encontrada' })
    }

    res.json(cita)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener cita', error: error.message })
  }
}

const crearCita = async (req, res) => {
  try {
    console.log('Creando cita:', req.body)
    const { fecha, hora, descripcion, usuarioId } = req.body

    if (!fecha || !hora || !usuarioId) {
      return res.status(400).json({ mensaje: 'Fecha, hora y cliente son obligatorios' })
    }

  const citaExiste = await prisma.cita.findFirst({
  where: {
    fecha: new Date(fecha),
    hora,
    estado: {
      notIn: ['cancelada']
    }
  }
})

    if (citaExiste) {
      return res.status(400).json({ mensaje: 'Ya existe una cita programada para esa fecha y hora' })
    }

    const cita = await prisma.cita.create({
      data: {
        fecha: new Date(fecha),
        hora,
        descripcion,
        usuarioId: parseInt(usuarioId),
        estado: 'pendiente'
      }
    })

   const cliente = await prisma.usuario.findUnique({
  where: { id: parseInt(usuarioId) },
  select: {
    id: true,
    nombre: true,
    telefono: true,
    email: true,
    clientePrincipalId: true,
    empresaId: true,
    recibeNotificaciones: true
  }
})
    await notificarCitaCreada(cita, cliente)

    res.status(201).json({
      mensaje: 'Cita agendada exitosamente',
      cita
    })
  } catch (error) {
    console.error('Error crear cita:', error.message)
    res.status(500).json({ mensaje: 'Error al agendar cita', error: error.message })
  }
}

const actualizarEstadoCita = async (req, res) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    if (!estado) {
      return res.status(400).json({ mensaje: 'El estado es obligatorio' })
    }

    const cita = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: { estado },
      include: {
        usuario: true
      }
    })

    if (estado === 'confirmada') {
      await notificarCitaConfirmada(cita, cita.usuario)

      const servicioExiste = await prisma.servicio.findFirst({
        where: { citaId: cita.id }
      })

      if (!servicioExiste) {
        await prisma.servicio.create({
          data: {
            tipo: 'Servicio Técnico',
            descripcion: cita.descripcion || 'Servicio agendado por el cliente',
            valor: 0,
            pagoInversion: 0,
            fechaServicio: new Date(cita.fecha.toISOString().split('T')[0] + 'T00:00:00'),
            usuarioId: cita.usuarioId,
            estado: 'pendiente',
            citaId: cita.id
          }
        })
      }
    } else if (estado === 'completada') {
      await notificarCitaCompletada(cita, cita.usuario)
    }

    res.json({
      mensaje: 'Estado de cita actualizado exitosamente',
      cita
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar estado de cita', error: error.message })
  }
}

const cancelarCita = async (req, res) => {
  try {
    const { id } = req.params

    const cita = await prisma.cita.update({
      where: { id: parseInt(id) },
      data: { estado: 'cancelada' },
      include: {
        usuario: true
      }
    })

    await notificarCitaCancelada(cita, cita.usuario)

    res.json({
      mensaje: 'Cita cancelada exitosamente',
      cita
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar cita', error: error.message })
  }
}

module.exports = { listarCitas, listarCitasPendientes, listarCitasPorCliente, obtenerCita, crearCita, actualizarEstadoCita, cancelarCita }