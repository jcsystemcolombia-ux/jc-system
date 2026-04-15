const prisma = require('../config/prisma')
const { notificarCuentaCobro } = require('../services/notificaciones')

const listarVentas = async (req, res) => {
  try {
    const ventas = await prisma.venta.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        items: true,
        cuentaCobro: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(ventas)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar ventas', error: error.message })
  }
}

const listarVentasPorCliente = async (req, res) => {
  try {
    const { usuarioId } = req.params
    const ventas = await prisma.venta.findMany({
      where: { usuarioId: parseInt(usuarioId) },
      include: {
        items: true,
        cuentaCobro: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(ventas)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar ventas del cliente', error: error.message })
  }
}

const obtenerVenta = async (req, res) => {
  try {
    const { id } = req.params
    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        items: true,
        cuentaCobro: true
      }
    })

    if (!venta) {
      return res.status(404).json({ mensaje: 'Venta no encontrada' })
    }

    res.json(venta)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener venta', error: error.message })
  }
}

const crearVenta = async (req, res) => {
  try {
    console.log('Body recibido:', JSON.stringify(req.body, null, 2))
    const { usuarioId, tipoPago, pagoInversion, items } = req.body

    if (!usuarioId || !tipoPago || !items || items.length === 0) {
      return res.status(400).json({ mensaje: 'Cliente, tipo de pago y al menos un producto son obligatorios' })
    }

    // Validar cantidades disponibles antes de crear
    for (const item of items) {
      if (item.compraId) {
        const compra = await prisma.compra.findUnique({
          where: { id: parseInt(item.compraId) }
        })
        if (!compra) {
          return res.status(400).json({ mensaje: `Compra #${item.compraId} no encontrada` })
        }
        const cantidadSolicitada = parseInt(item.cantidad) || 1
        if (cantidadSolicitada > compra.cantidadDisponible) {
          return res.status(400).json({ 
            mensaje: `Solo hay ${compra.cantidadDisponible} unidades disponibles de ${compra.producto}` 
          })
        }
      }
    }

    const totalVenta = items.reduce((acc, item) =>
      acc + (parseFloat(item.valorVenta) * (parseInt(item.cantidad) || 1)), 0)

    const venta = await prisma.venta.create({
      data: {
        tipoPago,
        pagoInversion: parseFloat(pagoInversion) || 0,
        usuarioId: parseInt(usuarioId),
        items: {
          create: await Promise.all(items.map(async (item) => {
            let tipoProductoFinal = item.tipoProducto || null
            let condicionFinal = item.condicion || null

            if (item.compraId) {
              const compra = await prisma.compra.findUnique({
                where: { id: parseInt(item.compraId) }
              })
              if (compra) {
                tipoProductoFinal = compra.tipoProducto
                condicionFinal = compra.condicion
              }
            }

            const cantidad = parseInt(item.cantidad) || 1
            const ganancia = (parseFloat(item.valorVenta) - (parseFloat(item.valorCompra) || 0)) * cantidad

            return {
              producto: item.producto,
              proveedor: item.proveedor || null,
              proveedorId: item.proveedorId ? parseInt(item.proveedorId) : null,
              valorCompra: parseFloat(item.valorCompra) || 0,
              valorVenta: parseFloat(item.valorVenta),
              ganancia,
              cantidad,
              tipoProducto: tipoProductoFinal,
              condicion: condicionFinal,
              compraId: item.compraId ? parseInt(item.compraId) : null
            }
          }))
        }
      },
      include: { items: true }
    })

    // Actualizar compras descontando cantidad
    for (const item of items) {
      if (item.compraId) {
        const compra = await prisma.compra.findUnique({
          where: { id: parseInt(item.compraId) }
        })
        if (compra) {
          const cantidadVendida = parseInt(item.cantidad) || 1
          const nuevaCantidadDisponible = compra.cantidadDisponible - cantidadVendida
          await prisma.compra.update({
            where: { id: parseInt(item.compraId) },
            data: {
              cantidadDisponible: nuevaCantidadDisponible,
              estado: nuevaCantidadDisponible <= 0 ? 'no_disponible' : 'disponible',
              tipoUso: 'venta',
              ventaId: venta.id
            }
          })
        }
      }
    }

    // Verificar si ya existe cuenta de cobro para esta venta
    const cuentaExiste = await prisma.cuentaCobro.findUnique({
      where: { ventaId: venta.id }
    })

    if (!cuentaExiste) {
      const cuentaCobro = await prisma.cuentaCobro.create({
        data: {
          total: totalVenta,
          estado: 'pendiente',
          usuarioId: parseInt(usuarioId),
          ventaId: venta.id
        }
      })

      const cliente = await prisma.usuario.findUnique({
        where: { id: parseInt(usuarioId) },
        select: {
          id: true,
          nombre: true,
          telefono: true,
          clientePrincipalId: true,
          empresaId: true,
          recibeNotificaciones: true
        }
      })

  const conceptos = venta.items.map(i => 
  i.cantidad > 1 ? `${i.producto} (x${i.cantidad})` : i.producto
).join(', ')
await notificarCuentaCobro({
  ...cuentaCobro,
  concepto: conceptos
}, cliente)
}

    res.status(201).json({
      mensaje: 'Venta registrada exitosamente',
      venta
    })
  } catch (error) {
    console.error('Error crear venta:', error)
    res.status(500).json({ mensaje: 'Error al registrar venta', error: error.message })
  }
}

const editarVenta = async (req, res) => {
  try {
    const { id } = req.params
    const { tipoPago, pagoInversion, items } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ mensaje: 'Al menos un producto es obligatorio' })
    }

    // Eliminar items anteriores
    await prisma.ventaItem.deleteMany({
      where: { ventaId: parseInt(id) }
    })

    // Actualizar venta con nuevos items
    const venta = await prisma.venta.update({
      where: { id: parseInt(id) },
      data: {
        tipoPago,
        pagoInversion: parseFloat(pagoInversion) || 0,
        items: {
          create: items.map((item) => {
            const ganancia = parseFloat(item.valorVenta) - (parseFloat(item.valorCompra) || 0)
            return {
              producto: item.producto,
              proveedor: item.proveedor || null,
              proveedorId: item.proveedorId ? parseInt(item.proveedorId) : null,
              valorCompra: parseFloat(item.valorCompra) || 0,
              valorVenta: parseFloat(item.valorVenta),
              ganancia,
              tipoProducto: item.tipoProducto || null,
              condicion: item.condicion || null,
              compraId: item.compraId ? parseInt(item.compraId) : null
            }
          })
        }
      },
      include: {
        items: true
      }
    })

    // Actualizar cuenta de cobro con nuevo total
    const totalVenta = items.reduce((acc, item) => acc + parseFloat(item.valorVenta), 0)
    await prisma.cuentaCobro.updateMany({
      where: { ventaId: parseInt(id) },
      data: { total: totalVenta }
    })

    res.json({
      mensaje: 'Venta actualizada exitosamente',
      venta
    })
  } catch (error) {
    console.error('Error editar venta:', error)
    res.status(500).json({ mensaje: 'Error al editar venta', error: error.message })
  }
}

module.exports = { listarVentas, listarVentasPorCliente, obtenerVenta, crearVenta, editarVenta }