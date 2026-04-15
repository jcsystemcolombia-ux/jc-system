const prisma = require('../config/prisma')

const listarEmpresas = async (req, res) => {
  try {
    const empresas = await prisma.empresa.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            rol: true,
            clientePrincipalId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(empresas)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar empresas', error: error.message })
  }
}

const obtenerEmpresa = async (req, res) => {
  try {
    const { id } = req.params
    const empresa = await prisma.empresa.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            rol: true,
            clientePrincipalId: true
          }
        }
      }
    })

    if (!empresa) {
      return res.status(404).json({ mensaje: 'Empresa no encontrada' })
    }

    res.json(empresa)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener empresa', error: error.message })
  }
}

const crearEmpresa = async (req, res) => {
  try {
    const { nombre, nit, direccion, telefono } = req.body

    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre de la empresa es obligatorio' })
    }

    const empresa = await prisma.empresa.create({
      data: { nombre, nit, direccion, telefono }
    })

    res.status(201).json({
      mensaje: 'Empresa creada exitosamente',
      empresa
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear empresa', error: error.message })
  }
}

const editarEmpresa = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, nit, direccion, telefono } = req.body

    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre de la empresa es obligatorio' })
    }

    const empresa = await prisma.empresa.update({
      where: { id: parseInt(id) },
      data: { nombre, nit, direccion, telefono }
    })

    res.json({
      mensaje: 'Empresa actualizada exitosamente',
      empresa
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al editar empresa', error: error.message })
  }
}

module.exports = { listarEmpresas, obtenerEmpresa, crearEmpresa, editarEmpresa }