const prisma = require('../config/prisma')
const { notificarCuentaCobro, notificarCuentaPagada } = require('../services/notificaciones')

const listarCuentasCobro = async (req, res) => {
  try {
    const cuentas = await prisma.cuentaCobro.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            nitCedula: true,
            direccion: true,
            clientePrincipalId: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        servicio: true,
        venta: {
          include: {
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(cuentas)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar cuentas de cobro', error: error.message })
  }
}

const listarCuentasPendientes = async (req, res) => {
  try {
    const cuentas = await prisma.cuentaCobro.findMany({
      where: { estado: 'pendiente' },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            nitCedula: true,
            direccion: true,
            clientePrincipalId: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        servicio: true,
        venta: {
          include: {
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(cuentas)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar cuentas pendientes', error: error.message })
  }
}

const listarCuentasPorCliente = async (req, res) => {
  try {
    const { usuarioId } = req.params
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(usuarioId) }
    })

    let cuentas = []

    if (usuario.rol === 'cliente') {
      const subClienteIds = await prisma.usuario.findMany({
        where: { clientePrincipalId: parseInt(usuarioId) },
        select: { id: true }
      })
      const ids = [parseInt(usuarioId), ...subClienteIds.map(s => s.id)]
      cuentas = await prisma.cuentaCobro.findMany({
        where: { usuarioId: { in: ids } },
        include: {
          servicio: true,
          venta: {
            include: { items: true }
          },
          usuario: {
            select: { id: true, nombre: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      cuentas = await prisma.cuentaCobro.findMany({
        where: { usuarioId: parseInt(usuarioId) },
        include: {
          servicio: true,
          venta: {
            include: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    res.json(cuentas)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar cuentas del cliente', error: error.message })
  }
}

const obtenerCuentaCobro = async (req, res) => {
  try {
    const { id } = req.params
    const cuenta = await prisma.cuentaCobro.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            nitCedula: true,
            direccion: true,
            clientePrincipalId: true,
            empresa: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        },
        servicio: true,
        venta: {
          include: { items: true }
        }
      }
    })

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta de cobro no encontrada' })
    }

    res.json(cuenta)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener cuenta de cobro', error: error.message })
  }
}

const marcarComoPagada = async (req, res) => {
  try {
    const { id } = req.params

    const cuenta = await prisma.cuentaCobro.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'pagada',
        fechaPago: new Date()
      },
      include: {
        usuario: true,
        servicio: true,
        venta: {
          include: { items: true }
        }
      }
    })

    // Construir concepto con cantidades
    const concepto = cuenta.servicio
      ? cuenta.servicio.tipo
      : cuenta.venta?.items?.length > 0
        ? cuenta.venta.items.map(i =>
            i.cantidad > 1 ? `${i.producto} (x${i.cantidad})` : i.producto
          ).join(', ')
        : 'Servicio prestado'

    await notificarCuentaPagada({
      ...cuenta,
      concepto
    }, cuenta.usuario)

    res.json({
      mensaje: 'Cuenta de cobro marcada como pagada',
      cuenta
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al marcar cuenta como pagada', error: error.message })
  }
}

const generarPDF = async (req, res) => {
  try {
    const { id } = req.params
    const cuenta = await prisma.cuentaCobro.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            nitCedula: true,
            direccion: true
          }
        },
        servicio: true,
        venta: {
          include: { items: true }
        }
      }
    })

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta de cobro no encontrada' })
    }

    const descripcion = cuenta.servicio
      ? cuenta.servicio.descripcion
      : cuenta.venta?.items?.length > 0
        ? cuenta.venta.items.map(i =>
            i.cantidad > 1 ? `${i.producto} (x${i.cantidad})` : i.producto
          ).join(', ')
        : 'Servicio prestado'

    const html = `
      <html>
      <body style="font-family: Arial, sans-serif; padding: 40px;">
        <h3>Juan Camilo Echeverri Flórez</h3>
        <p>Ingeniero de Sistemas</p>
        <p>Cel. 311 764 04 59</p>
        <hr/>
        <p style="text-align:right"><strong>Cuenta de Cobro # ${cuenta.numeroCuenta}</strong></p>
        <p><strong>Ciudad y Fecha:</strong> Medellín, ${new Date(cuenta.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>Vencimiento:</strong> ${cuenta.fechaVence ? new Date(cuenta.fechaVence).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Inmediato'}</p>
        <br/>
        <h3 style="text-align:center">(${cuenta.usuario.nombre.toUpperCase()})</h3>
        <p style="text-align:center">Nit. o cédula: ${cuenta.usuario.nitCedula || '____________'}</p>
        <p style="text-align:center">Debe a</p>
        <h3 style="text-align:center">Juan Camilo Echeverri Florez</h3>
        <p>La suma de <strong>$${cuenta.total.toLocaleString('es-CO')}</strong> por concepto de:</p>
        <table border="1" cellpadding="8" width="100%" style="border-collapse:collapse">
          <tr>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Valor Unitario</th>
            <th>Valor Total</th>
          </tr>
          <tr>
            <td>${descripcion}</td>
            <td>1</td>
            <td>$${cuenta.total.toLocaleString('es-CO')}</td>
            <td>$${cuenta.total.toLocaleString('es-CO')}</td>
          </tr>
          <tr>
            <td colspan="3" align="right"><strong>Total</strong></td>
            <td><strong>$${cuenta.total.toLocaleString('es-CO')}</strong></td>
          </tr>
        </table>
        <br/>
        <p>Consignar en la cuenta 006-243435-73 ahorros Bancolombia.</p>
        <br/><br/>
        <p>________________________</p>
        <p>Juan Camilo Echeverri Florez</p>
        <p>CC 8128497</p>
        <br/>
        <p><strong>Nota:</strong> En virtud de lo contemplado en el art.616-2 del ET, quienes sean responsables del IVA en el Régimen Simplificado no están obligados a expedir factura de venta por las ventas de bienes o prestación de servicios que realicen.</p>
      </body>
      </html>
    `

    res.json({
      mensaje: 'HTML de cuenta de cobro generado',
      numeroCuenta: cuenta.numeroCuenta,
      html
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar cuenta de cobro', error: error.message })
  }
}

module.exports = { listarCuentasCobro, listarCuentasPendientes, listarCuentasPorCliente, obtenerCuentaCobro, marcarComoPagada, generarPDF }