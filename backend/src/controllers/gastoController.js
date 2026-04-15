const prisma = require('../config/prisma')

const listarGastos = async (req, res) => {
  try {
    const gastos = await prisma.gasto.findMany({
      orderBy: { fecha: 'desc' }
    })
    res.json(gastos)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar gastos', error: error.message })
  }
}

const obtenerGasto = async (req, res) => {
  try {
    const { id } = req.params
    const gasto = await prisma.gasto.findUnique({
      where: { id: parseInt(id) }
    })

    if (!gasto) {
      return res.status(404).json({ mensaje: 'Gasto no encontrado' })
    }

    res.json(gasto)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener gasto', error: error.message })
  }
}

const crearGasto = async (req, res) => {
  try {
    const { tipo, categoria, valor, descripcion, fecha } = req.body

    if (!tipo || !categoria || !valor) {
      return res.status(400).json({ mensaje: 'Tipo, categoría y valor son obligatorios' })
    }

    const gasto = await prisma.gasto.create({
      data: {
        tipo,
        categoria,
        valor: parseFloat(valor),
        descripcion,
        fecha: fecha ? new Date(fecha) : new Date()
      }
    })

    res.status(201).json({
      mensaje: 'Gasto registrado exitosamente',
      gasto
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar gasto', error: error.message })
  }
}

const editarGasto = async (req, res) => {
  try {
    const { id } = req.params
    const { tipo, categoria, valor, descripcion, fecha } = req.body

    const gasto = await prisma.gasto.update({
      where: { id: parseInt(id) },
      data: {
        tipo,
        categoria,
        valor: valor ? parseFloat(valor) : undefined,
        descripcion,
        fecha: fecha ? new Date(fecha) : undefined
      }
    })

    res.json({
      mensaje: 'Gasto actualizado exitosamente',
      gasto
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al editar gasto', error: error.message })
  }
}

const listarGastosPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params
    const gastos = await prisma.gasto.findMany({
      where: { categoria },
      orderBy: { fecha: 'desc' }
    })
    res.json(gastos)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar gastos por categoría', error: error.message })
  }
}

const listarGastosPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params
    const gastos = await prisma.gasto.findMany({
      where: { tipo },
      orderBy: { fecha: 'desc' }
    })
    res.json(gastos)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar gastos por tipo', error: error.message })
  }
}

module.exports = { listarGastos, obtenerGasto, crearGasto, editarGasto, listarGastosPorCategoria, listarGastosPorTipo }