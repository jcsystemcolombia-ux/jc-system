const prisma = require('../config/prisma')

const listarCompras = async (req, res) => {
  try {
    const compras = await prisma.compra.findMany({
      include: { proveedor_r: true },
      orderBy: { createdAt: 'desc' }
    })

    const comprasConContadores = await Promise.all(compras.map(async (compra) => {
      const ventaItems = await prisma.ventaItem.findMany({
        where: { compraId: compra.id }
      })
      const unidadesVendidas = ventaItems.reduce((acc, i) => acc + (i.cantidad || 1), 0)

      const unidadesGarantia = await prisma.servicio.count({
        where: { compraRepuestoId: compra.id }
      })

      return { ...compra, unidadesVendidas, unidadesGarantia }
    }))

    res.json(comprasConContadores)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar compras', error: error.message })
  }
}

const listarComprasDisponibles = async (req, res) => {
  try {
    const compras = await prisma.compra.findMany({
      where: { estado: 'disponible' },
      include: {
        proveedor_r: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(compras)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar compras disponibles', error: error.message })
  }
}

const obtenerCompra = async (req, res) => {
  try {
    const { id } = req.params
    const compra = await prisma.compra.findUnique({
      where: { id: parseInt(id) },
      include: { proveedor_r: true }
    })

    if (!compra) {
      return res.status(404).json({ mensaje: 'Compra no encontrada' })
    }

    const ventaItems = await prisma.ventaItem.findMany({
      where: { compraId: compra.id }
    })
    const unidadesVendidas = ventaItems.reduce((acc, i) => acc + (i.cantidad || 1), 0)
    const unidadesGarantia = await prisma.servicio.count({
      where: { compraRepuestoId: compra.id }
    })

    res.json({ ...compra, unidadesVendidas, unidadesGarantia })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener compra', error: error.message })
  }
}

const crearCompra = async (req, res) => {
  try {
    const { producto, proveedorId, valorUnitario, cantidad, tipoPago, descripcion, tipoProducto, condicion } = req.body

    if (!producto || !valorUnitario || !tipoPago || !cantidad) {
      return res.status(400).json({ mensaje: 'Producto, valor unitario, cantidad y tipo de pago son obligatorios' })
    }

    const cantidadInt = parseInt(cantidad)
    const valorUnitarioFloat = parseFloat(valorUnitario)
    const valorTotal = valorUnitarioFloat * cantidadInt

    const compra = await prisma.compra.create({
      data: {
        producto,
        proveedorId: proveedorId ? parseInt(proveedorId) : null,
        valorUnitario: valorUnitarioFloat,
        valorTotal,
        cantidad: cantidadInt,
        cantidadDisponible: cantidadInt,
        tipoPago,
        descripcion,
        tipoProducto,
        condicion,
        estado: 'disponible'
      }
    })

    res.status(201).json({
      mensaje: 'Compra registrada exitosamente',
      compra
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar compra', error: error.message })
  }
}

const editarCompra = async (req, res) => {
  try {
    const { id } = req.params
    const { producto, proveedorId, valorUnitario, cantidad, tipoPago, descripcion, tipoProducto, condicion, estado } = req.body

    const cantidadInt = parseInt(cantidad)
    const valorUnitarioFloat = parseFloat(valorUnitario)
    const valorTotal = valorUnitarioFloat * cantidadInt

    const compra = await prisma.compra.update({
      where: { id: parseInt(id) },
      data: {
        producto,
        proveedorId: proveedorId ? parseInt(proveedorId) : null,
        valorUnitario: valorUnitarioFloat,
        valorTotal,
        cantidad: cantidadInt,
        tipoPago,
        descripcion,
        tipoProducto,
        condicion,
        estado
      }
    })

    res.json({
      mensaje: 'Compra actualizada exitosamente',
      compra
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al editar compra', error: error.message })
  }
}

const agregarStock = async (req, res) => {
  try {
    const { id } = req.params
    const { cantidadAgregar, valorUnitario } = req.body

    if (!cantidadAgregar || parseInt(cantidadAgregar) <= 0) {
      return res.status(400).json({ mensaje: 'La cantidad a agregar debe ser mayor a 0' })
    }

    const compra = await prisma.compra.findUnique({
      where: { id: parseInt(id) }
    })

    if (!compra) {
      return res.status(404).json({ mensaje: 'Compra no encontrada' })
    }

    const cantidadInt = parseInt(cantidadAgregar)
    const nuevaCantidad = compra.cantidad + cantidadInt
    const nuevaCantidadDisponible = compra.cantidadDisponible + cantidadInt
    const nuevoValorUnitario = valorUnitario ? parseFloat(valorUnitario) : compra.valorUnitario
    const nuevoValorTotal = nuevoValorUnitario * nuevaCantidad

    const compraActualizada = await prisma.compra.update({
      where: { id: parseInt(id) },
      data: {
        cantidad: nuevaCantidad,
        cantidadDisponible: nuevaCantidadDisponible,
        valorUnitario: nuevoValorUnitario,
        valorTotal: nuevoValorTotal,
        estado: 'disponible'
      }
    })

    res.json({
      mensaje: 'Stock agregado exitosamente',
      compra: compraActualizada
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agregar stock', error: error.message })
  }
}

module.exports = { listarCompras, listarComprasDisponibles, obtenerCompra, crearCompra, editarCompra, agregarStock }