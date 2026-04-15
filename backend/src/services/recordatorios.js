const cron = require('node-cron')
const prisma = require('../config/prisma')
const { notificarRecordatorioPago } = require('./notificaciones')

let tareaActual = null

const ejecutarRecordatorios = async () => {
  console.log('🔔 Ejecutando recordatorios de pago...')
  try {
    const config = await prisma.configRecordatorios.findFirst()
    const diasEspera = config?.diasEspera || 3

    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - diasEspera)

    const cuentasPendientes = await prisma.cuentaCobro.findMany({
      where: {
        estado: 'pendiente',
        createdAt: { lte: fechaLimite }
      },
      include: {
        usuario: true,
        servicio: true,
        venta: {
          include: { items: true }
        }
      }
    })

    console.log(`📋 Cuentas pendientes encontradas: ${cuentasPendientes.length}`)

    for (const cuenta of cuentasPendientes) {
      const concepto = cuenta.servicio
        ? cuenta.servicio.tipo
        : cuenta.venta?.items?.length > 0
          ? cuenta.venta.items.map(i =>
              i.cantidad > 1 ? `${i.producto} (x${i.cantidad})` : i.producto
            ).join(', ')
          : 'Servicio prestado'

      await notificarRecordatorioPago({ ...cuenta, concepto }, cuenta.usuario)
      console.log(`✅ Recordatorio enviado a ${cuenta.usuario.nombre}`)
    }
  } catch (error) {
    console.error('Error enviando recordatorios:', error)
  }
}

const obtenerExpresionCron = (config) => {
  const hora = config?.hora || 10
  const minutos = config?.minutos || 0
  const frecuencia = config?.frecuencia || 'diario'

  if (frecuencia === 'semanal') {
    return `${minutos} ${hora} * * 1`
  }
  return `${minutos} ${hora} * * *`
}

const iniciarRecordatorios = async () => {
  try {
    const config = await prisma.configRecordatorios.findFirst()
    const expresion = obtenerExpresionCron(config)

    if (tareaActual) {
      tareaActual.stop()
    }

    tareaActual = cron.schedule(expresion, ejecutarRecordatorios)

    const frecuencia = config?.frecuencia || 'diario'
    const hora = config?.hora || 10
    const minutos = config?.minutos || 0
    console.log(`⏰ Recordatorios automáticos iniciados — ${frecuencia === 'semanal' ? 'todos los lunes' : 'todos los días'} a las ${hora}:${minutos === 0 ? '00' : minutos < 10 ? `0${minutos}` : minutos}`)
  } catch (error) {
    console.error('Error iniciando recordatorios:', error)
    tareaActual = cron.schedule('0 10 * * *', ejecutarRecordatorios)
    console.log('⏰ Recordatorios iniciados con configuración por defecto')
  }
}

const reiniciarRecordatorios = async () => {
  console.log('🔄 Reiniciando recordatorios con nueva configuración...')
  await iniciarRecordatorios()
}

module.exports = { iniciarRecordatorios, reiniciarRecordatorios }