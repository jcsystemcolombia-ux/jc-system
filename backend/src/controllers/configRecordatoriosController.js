const prisma = require('../config/prisma')
const { reiniciarRecordatorios } = require('../services/recordatorios')

const obtenerConfig = async (req, res) => {
  try {
    let config = await prisma.configRecordatorios.findFirst()
    if (!config) {
      config = await prisma.configRecordatorios.create({
        data: {
          diasEspera: 3,
          frecuencia: 'diario',
          hora: 10
        }
      })
    }
    res.json(config)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener configuración', error: error.message })
  }
}

const actualizarConfig = async (req, res) => {
  try {
    const { diasEspera, frecuencia, hora, minutos } = req.body

    if (!diasEspera || !frecuencia || hora === undefined || minutos === undefined) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' })
    }

    if (!['diario', 'semanal'].includes(frecuencia)) {
      return res.status(400).json({ mensaje: 'Frecuencia debe ser diario o semanal' })
    }

    if (hora < 0 || hora > 23) {
      return res.status(400).json({ mensaje: 'La hora debe estar entre 0 y 23' })
    }

    if (minutos < 0 || minutos > 59) {
      return res.status(400).json({ mensaje: 'Los minutos deben estar entre 0 y 59' })
    }

    let config = await prisma.configRecordatorios.findFirst()

    if (config) {
      config = await prisma.configRecordatorios.update({
        where: { id: config.id },
        data: { diasEspera: parseInt(diasEspera), frecuencia, hora: parseInt(hora), minutos: parseInt(minutos) }
      })
    } else {
      config = await prisma.configRecordatorios.create({
        data: { diasEspera: parseInt(diasEspera), frecuencia, hora: parseInt(hora), minutos: parseInt(minutos) }
      })
    }

    await reiniciarRecordatorios()

    res.json({ mensaje: 'Configuración actualizada exitosamente', config })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar configuración', error: error.message })
  }
}

module.exports = { obtenerConfig, actualizarConfig }