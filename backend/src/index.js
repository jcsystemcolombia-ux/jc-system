const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { conectarWhatsApp } = require('./services/whatsapp')
const { iniciarRecordatorios } = require('./services/recordatorios')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Rutas
const authRoutes = require('./routes/authRoutes')
const clienteRoutes = require('./routes/clienteRoutes')
const servicioRoutes = require('./routes/servicioRoutes')
const ventaRoutes = require('./routes/ventaRoutes')
const compraRoutes = require('./routes/compraRoutes')
const gastoRoutes = require('./routes/gastoRoutes')
const cuentaCobroRoutes = require('./routes/cuentaCobroRoutes')
const citaRoutes = require('./routes/citaRoutes')
const empresaRoutes = require('./routes/empresaRoutes')
const proveedorRoutes = require('./routes/proveedorRoutes')
const configRecordatoriosRoutes = require('./routes/configRecordatoriosRoutes')

app.use('/api/auth', authRoutes)
app.use('/api/clientes', clienteRoutes)
app.use('/api/servicios', servicioRoutes)
app.use('/api/ventas', ventaRoutes)
app.use('/api/compras', compraRoutes)
app.use('/api/gastos', gastoRoutes)
app.use('/api/cuentas-cobro', cuentaCobroRoutes)
app.use('/api/citas', citaRoutes)
app.use('/api/empresas', empresaRoutes)
app.use('/api/proveedores', proveedorRoutes)
app.use('/api/config-recordatorios', configRecordatoriosRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'JC System API funcionando ✅' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
  conectarWhatsApp()
  iniciarRecordatorios()
})