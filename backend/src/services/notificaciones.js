const { enviarMensaje } = require('./whatsapp')
const prisma = require('../config/prisma')

const obtenerEmpresa = async (usuario) => {
  if (usuario.empresaId) {
    const empresa = await prisma.empresa.findUnique({
      where: { id: usuario.empresaId }
    })
    return empresa?.nombre || null
  }
  return null
}

const formatearFechaWhatsApp = (fechaInput) => {
  const fechaStr = typeof fechaInput === 'string' ? fechaInput : fechaInput.toISOString()
  const fecha = fechaStr.split('T')[0]
  const [anio, mes, dia] = fecha.split('-')
  const fechaLocal = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia))
  return fechaLocal.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const notificarCitaCreada = async (cita, cliente) => {
  if (!cliente.telefono || cliente.recibeNotificaciones === false) return

  const empresa = await obtenerEmpresa(cliente)
  const nombreEmpresa = empresa ? ` de ${empresa}` : ''

  const mensaje = `👋 Hola ${cliente.nombre}, tu cita ha sido registrada exitosamente en JC System.

📅 Fecha: ${formatearFechaWhatsApp(cita.fecha)}
🕐 Hora: ${cita.hora}
📝 Servicio: ${cita.descripcion || 'Servicio técnico'}

En breve confirmaremos tu cita. ¡Gracias por confiar en nosotros! 🙏`

  await enviarMensaje(cliente.telefono, mensaje)

  if (cliente.clientePrincipalId) {
    const principal = await prisma.usuario.findUnique({
      where: { id: cliente.clientePrincipalId }
    })
    if (principal?.telefono) {
      const mensajePrincipal = `👋 Hola ${principal.nombre}, ${cliente.nombre}${nombreEmpresa} ha solicitado un servicio técnico a JC System.

📅 Fecha: ${formatearFechaWhatsApp(cita.fecha)}
🕐 Hora: ${cita.hora}
📝 Descripción: ${cita.descripcion || 'Servicio técnico'}

En breve confirmaremos la cita. ¡Gracias por confiar en nosotros! 🙏`

      await enviarMensaje(principal.telefono, mensajePrincipal)
    }
  }
}

const notificarCitaConfirmada = async (cita, cliente) => {
 if (!cliente.telefono || cliente.recibeNotificaciones === false) return

  const empresa = await obtenerEmpresa(cliente)
  const nombreEmpresa = empresa ? ` para ${empresa}` : ''

  const mensaje = `✅ Hola ${cliente.nombre}, tu cita${nombreEmpresa} ha sido CONFIRMADA.

📅 Fecha: ${formatearFechaWhatsApp(cita.fecha)}
🕐 Hora: ${cita.hora}
📝 Servicio: ${cita.descripcion || 'Servicio técnico'}

Por favor estar puntual en el sitio de la visita. Si necesitas cancelar o reprogramar escríbenos. 📱`

  await enviarMensaje(cliente.telefono, mensaje)
}

const notificarCitaCancelada = async (cita, cliente) => {
  if (!cliente.telefono || cliente.recibeNotificaciones === false) return

  const empresa = await obtenerEmpresa(cliente)
  const nombreEmpresa = empresa ? ` de ${empresa}` : ''

  const mensaje = `❌ Hola ${cliente.nombre}, tu cita${nombreEmpresa} ha sido cancelada.

📅 Fecha: ${formatearFechaWhatsApp(cita.fecha)}
🕐 Hora: ${cita.hora}

Si deseas reagendar escríbenos o ingresa al portal. ¡Estamos para servirte! 🙌`

  await enviarMensaje(cliente.telefono, mensaje)
}

const notificarCitaCompletada = async (cita, cliente) => {
  if (!cliente.telefono || cliente.recibeNotificaciones === false) return

  const empresa = await obtenerEmpresa(cliente)
  const nombreEmpresa = empresa ? ` para ${empresa}` : ''

  const mensaje = `🎉 Hola ${cliente.nombre}, tu servicio${nombreEmpresa} ha sido completado exitosamente.

📝 Servicio: ${cita.descripcion || 'Servicio técnico'}

Pronto recibirás tu cuenta de cobro. ¡Gracias por confiar en JC System! 💙`

  await enviarMensaje(cliente.telefono, mensaje)
}

const notificarCuentaCobro = async (cuenta, cliente) => {
  if (!cliente.telefono || cliente.recibeNotificaciones === false) return

  const empresa = await obtenerEmpresa(cliente)
  const nombreEmpresa = empresa || cliente.nombre

  const mensaje = `📄 Hola ${cliente.nombre}, se ha generado una cuenta de cobro para ${nombreEmpresa} por servicio solicitado a JC System.

🔢 Cuenta #${cuenta.numeroCuenta}
💰 Total: $${cuenta.total.toLocaleString('es-CO')}
📝 Concepto: ${cuenta.concepto || 'Servicio prestado'}

Para pagar consigna a:
🏦 Bancolombia Ahorros
💳 006-243435-73
👤 Juan Camilo Echeverri Flórez

Ingresa al portal para ver el detalle. ¡Gracias! 🙏`

  await enviarMensaje(cliente.telefono, mensaje)

  if (cliente.clientePrincipalId) {
    const principal = await prisma.usuario.findUnique({
      where: { id: cliente.clientePrincipalId }
    })
    if (principal?.telefono) {
      const mensajePrincipal = `📄 Hola ${principal.nombre}, se ha generado una cuenta de cobro para ${nombreEmpresa} por servicio solicitado por ${cliente.nombre} a JC System.

🔢 Cuenta #${cuenta.numeroCuenta}
💰 Total: $${cuenta.total.toLocaleString('es-CO')}
📝 Concepto: ${cuenta.concepto || 'Servicio prestado'}

Para pagar consigna a:
🏦 Bancolombia Ahorros
💳 006-243435-73
👤 Juan Camilo Echeverri Flórez

Ingresa al portal para ver el detalle. ¡Gracias! 🙏`

      await enviarMensaje(principal.telefono, mensajePrincipal)
    }
  }
}

const notificarCuentaPagada = async (cuenta, cliente) => {
  if (!cliente.telefono || cliente.recibeNotificaciones === false) return

  const empresa = await obtenerEmpresa(cliente)
  const nombreEmpresa = empresa || cliente.nombre

  const mensaje = `✅ Hola ${cliente.nombre}, hemos recibido el pago de ${nombreEmpresa}.

🔢 Cuenta #${cuenta.numeroCuenta}
💰 Total: $${cuenta.total.toLocaleString('es-CO')}
📝 Concepto: ${cuenta.concepto || 'Servicio prestado'}

¡Gracias por tu pago puntual! 🙏`

  await enviarMensaje(cliente.telefono, mensaje)

  if (cliente.clientePrincipalId) {
    const principal = await prisma.usuario.findUnique({
      where: { id: cliente.clientePrincipalId }
    })
    if (principal?.telefono) {
      const mensajePrincipal = `✅ Hola ${principal.nombre}, la cuenta de cobro de ${nombreEmpresa} por servicio de ${cliente.nombre} ha sido pagada.

🔢 Cuenta #${cuenta.numeroCuenta}
💰 Total: $${cuenta.total.toLocaleString('es-CO')}
📝 Concepto: ${cuenta.concepto || 'Servicio prestado'}

¡Gracias! 🙏`

      await enviarMensaje(principal.telefono, mensajePrincipal)
    }
  }
}

const notificarRecordatorioPago = async (cuenta, cliente) => {
  if (!cliente.telefono || cliente.recibeNotificaciones === false) return

  const empresa = await obtenerEmpresa(cliente)
  const nombreEmpresa = empresa || cliente.nombre

  const mensaje = `⚠️ Hola ${cliente.nombre}, te recordamos que ${nombreEmpresa} tiene una cuenta pendiente de pago.

🔢 Cuenta #${cuenta.numeroCuenta}
💰 Total: $${cuenta.total.toLocaleString('es-CO')}
📝 Concepto: ${cuenta.concepto || 'Servicio prestado'}

Para pagar consigna a:
🏦 Bancolombia Ahorros
💳 006-243435-73
👤 Juan Camilo Echeverri Flórez

Si ya realizaste el pago por favor ignora este mensaje. ¡Gracias! 🙏`

  await enviarMensaje(cliente.telefono, mensaje)

  if (cliente.clientePrincipalId) {
    const principal = await prisma.usuario.findUnique({
      where: { id: cliente.clientePrincipalId }
    })
    if (principal?.telefono) {
      const mensajePrincipal = `⚠️ Hola ${principal.nombre}, ${nombreEmpresa} tiene una cuenta pendiente de pago por servicio de ${cliente.nombre}.

🔢 Cuenta #${cuenta.numeroCuenta}
💰 Total: $${cuenta.total.toLocaleString('es-CO')}
📝 Concepto: ${cuenta.concepto || 'Servicio prestado'}

Para pagar consigna a:
🏦 Bancolombia Ahorros
💳 006-243435-73
👤 Juan Camilo Echeverri Flórez`

      await enviarMensaje(principal.telefono, mensajePrincipal)
    }
  }
}

const notificarRecordatorioCita = async (cita, cliente) => {
  if (!cliente.telefono || cliente.recibeNotificaciones === false) return

  const mensaje = `⏰ Hola ${cliente.nombre}, te recordamos que tienes una cita programada en *1 hora*.

📅 Fecha: ${formatearFechaWhatsApp(cita.fecha)}
🕐 Hora: ${cita.hora}
📝 Servicio: ${cita.descripcion || 'Servicio técnico'}

Por favor llega puntual. ¡Te esperamos! 🙏`

  await enviarMensaje(cliente.telefono, mensaje)
}

module.exports = {
  notificarCitaCreada,
  notificarCitaConfirmada,
  notificarCitaCancelada,
  notificarCitaCompletada,
  notificarCuentaCobro,
  notificarCuentaPagada,
  notificarRecordatorioPago,
  notificarRecordatorioCita
}