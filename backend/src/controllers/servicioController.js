const prisma = require('../config/prisma')
const { notificarCuentaCobro } = require('../services/notificaciones')

const listarServicios = async (req, res) => {
  try {
    const servicios = await prisma.servicio.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            direccion: true,
            direccionAdicional: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        cuentaCobro: true,
        garantiaVenta: {
          select: {
            id: true,
            items: {
              select: {
                producto: true,
                tipoProducto: true,
                condicion: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(servicios)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar servicios', error: error.message })
  }
}

const obtenerServicio = async (req, res) => {
  try {
    const { id } = req.params
    const servicio = await prisma.servicio.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            direccion: true,
            direccionAdicional: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        cuentaCobro: true,
        garantiaVenta: {
          select: {
            id: true,
            producto: true,
            tipoProducto: true,
            condicion: true
          }
        }
      }
    })

    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' })
    }

    res.json(servicio)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener servicio', error: error.message })
  }
}

const crearServicio = async (req, res) => {
  try {
    const { tipo, descripcion, fechaServicio, usuarioId } = req.body

    if (!tipo || !descripcion || !usuarioId) {
      return res.status(400).json({ mensaje: 'Tipo, descripción y cliente son obligatorios' })
    }

    const cliente = await prisma.usuario.findUnique({
      where: { id: parseInt(usuarioId) }
    })

    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' })
    }

    const servicio = await prisma.servicio.create({
      data: {
        tipo,
        descripcion,
        valor: 0,
        pagoInversion: 0,
        fechaServicio: fechaServicio ? new Date(fechaServicio) : null,
        usuarioId: parseInt(usuarioId),
        estado: 'pendiente'
      }
    })

    res.status(201).json({
      mensaje: 'Servicio creado exitosamente',
      servicio
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear servicio', error: error.message })
  }
}

const editarServicio = async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, descripcion, valor, fechaServicio, estado, pagoInversion, informeTecnico, garantiaVentaId, garantiaValor, descripcionRepuesto, compraRepuestoId } = req.body

    const valorFinal = valor ? parseFloat(valor) : undefined
    const inversionFinal = pagoInversion ? parseFloat(pagoInversion) : 0

          const servicio = await prisma.servicio.update({
          where: { id: parseInt(id) },
          data: {
            tipo,
            descripcion,
            valor: valorFinal,
            pagoInversion: inversionFinal,
            fechaServicio: fechaServicio ? new Date(fechaServicio) : undefined,
            estado,
            informeTecnico,
            garantiaVentaId: garantiaVentaId ? parseInt(garantiaVentaId) : undefined,
            garantiaValor: garantiaValor ? parseFloat(garantiaValor) : undefined,
            compraRepuestoId: compraRepuestoId ? parseInt(compraRepuestoId) : undefined
          }
        })

    if (servicio.estado === 'completado' && servicio.valor && servicio.valor > 0) {
      const cuentaExiste = await prisma.cuentaCobro.findUnique({
        where: { servicioId: servicio.id }
      })

      if (!cuentaExiste) {
        const cuentaCobro = await prisma.cuentaCobro.create({
          data: {
            total: servicio.valor,
            estado: 'pendiente',
            usuarioId: servicio.usuarioId,
            servicioId: servicio.id
          }
        })

        const cliente = await prisma.usuario.findUnique({
          where: { id: servicio.usuarioId }
        })

        await notificarCuentaCobro({
          ...cuentaCobro,
          concepto: servicio.tipo
        }, cliente)
      }

      if (servicio.citaId) {
        await prisma.cita.update({
          where: { id: servicio.citaId },
          data: { estado: 'completada' }
        })
      }
    }

    if (servicio.estado === 'garantia') {
      if (servicio.citaId) {
        await prisma.cita.update({
          where: { id: servicio.citaId },
          data: { estado: 'completada' }
        })
      }

      // Descontar del inventario si se seleccionó un repuesto
      if (compraRepuestoId) {
        const compra = await prisma.compra.findUnique({
          where: { id: parseInt(compraRepuestoId) }
        })
        if (compra) {
          const nuevaCantidadDisponible = compra.cantidadDisponible - 1
          await prisma.compra.update({
            where: { id: parseInt(compraRepuestoId) },
            data: {
              cantidadDisponible: nuevaCantidadDisponible,
              estado: nuevaCantidadDisponible <= 0 ? 'no_disponible' : 'disponible',
              tipoUso: 'garantia'
            }
          })
        }
      }

      if (garantiaValor && parseFloat(garantiaValor) > 0) {
        const ventaGarantia = garantiaVentaId ? await prisma.venta.findUnique({
          where: { id: parseInt(garantiaVentaId) },
          include: { items: true }
        }) : null

        const productoGarantia = ventaGarantia?.items?.length > 0
          ? ventaGarantia.items.map(i => i.producto).join(', ')
          : null

        const descripcionGasto = descripcionRepuesto
          ? `${descripcionRepuesto}${productoGarantia ? ` — Garantía de ${productoGarantia}` : ''} — Servicio #${servicio.id}`
          : productoGarantia
          ? `Garantía de ${productoGarantia} — Servicio #${servicio.id}`
          : `Garantía — Servicio #${servicio.id}`

        await prisma.gasto.create({
          data: {
            tipo: 'JC System',
            categoria: 'Garantias',
            valor: parseFloat(garantiaValor),
            descripcion: descripcionGasto,
            fecha: new Date()
          }
        })
      }
    }

    if (servicio.estado === 'cancelado' && servicio.citaId) {
      await prisma.cita.update({
        where: { id: servicio.citaId },
        data: { estado: 'cancelada' }
      })
    }

    const servicioActualizado = await prisma.servicio.findUnique({
      where: { id: servicio.id },
      include: {
        cuentaCobro: true,
        garantiaVenta: {
          select: {
            id: true,
            items: {
              select: {
                producto: true,
                tipoProducto: true,
                condicion: true
              }
            }
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            direccion: true,
            direccionAdicional: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    })

    res.json({
      mensaje: 'Servicio actualizado exitosamente',
      servicio: servicioActualizado
    })
  } catch (error) {
    console.error('Error editar servicio:', error)
    res.status(500).json({ mensaje: 'Error al editar servicio', error: error.message })
  }
}

const listarServiciosPorCliente = async (req, res) => {
  try {
    const { usuarioId } = req.params

    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(usuarioId) }
    })

    let servicios = []

    if (usuario.rol === 'cliente') {
      const subClienteIds = await prisma.usuario.findMany({
        where: { clientePrincipalId: parseInt(usuarioId) },
        select: { id: true }
      })
      const ids = [parseInt(usuarioId), ...subClienteIds.map(s => s.id)]
      servicios = await prisma.servicio.findMany({
        where: { usuarioId: { in: ids } },
        include: {
          cuentaCobro: true,
          usuario: {
            select: { id: true, nombre: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      servicios = await prisma.servicio.findMany({
        where: { usuarioId: parseInt(usuarioId) },
        include: {
          cuentaCobro: true
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    res.json(servicios)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar servicios del cliente', error: error.message })
  }
}

module.exports = { listarServicios, obtenerServicio, crearServicio, editarServicio, listarServiciosPorCliente }