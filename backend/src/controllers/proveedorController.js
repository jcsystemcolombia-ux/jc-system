const prisma = require('../config/prisma')

const listarProveedores = async (req, res) => {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: 'asc' }
    })
    res.json(proveedores)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar proveedores', error: error.message })
  }
}

const obtenerProveedor = async (req, res) => {
  try {
    const { id } = req.params
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: parseInt(id) },
      include: {
        compras: true
      }
    })

    if (!proveedor) {
      return res.status(404).json({ mensaje: 'Proveedor no encontrado' })
    }

    res.json(proveedor)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener proveedor', error: error.message })
  }
}

const crearProveedor = async (req, res) => {
  try {
    const { nombre, telefono, nit, direccion, tipo } = req.body

    if (!nombre || !tipo) {
      return res.status(400).json({ mensaje: 'Nombre y tipo son obligatorios' })
    }

    const proveedor = await prisma.proveedor.create({
      data: { nombre, telefono, nit, direccion, tipo }
    })

    res.status(201).json({
      mensaje: 'Proveedor creado exitosamente',
      proveedor
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear proveedor', error: error.message })
  }
}

const editarProveedor = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, telefono, nit, direccion, tipo } = req.body

    if (!nombre || !tipo) {
      return res.status(400).json({ mensaje: 'Nombre y tipo son obligatorios' })
    }

    const proveedor = await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: { nombre, telefono, nit, direccion, tipo }
    })

    res.json({
      mensaje: 'Proveedor actualizado exitosamente',
      proveedor
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al editar proveedor', error: error.message })
  }
}

module.exports = { listarProveedores, obtenerProveedor, crearProveedor, editarProveedor }