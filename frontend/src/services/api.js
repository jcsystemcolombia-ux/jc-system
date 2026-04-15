import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:3000/api'
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const login = (datos) => API.post('/auth/login', datos)

export const getClientes = () => API.get('/clientes')
export const getCliente = (id) => API.get(`/clientes/${id}`)
export const crearCliente = (datos) => API.post('/clientes', datos)
export const editarCliente = (id, datos) => API.put(`/clientes/${id}`, datos)

export const getServicios = () => API.get('/servicios')
export const getServicio = (id) => API.get(`/servicios/${id}`)
export const crearServicio = (datos) => API.post('/servicios', datos)
export const editarServicio = (id, datos) => API.put(`/servicios/${id}`, datos)

export const getVentas = () => API.get('/ventas')
export const getVenta = (id) => API.get(`/ventas/${id}`)
export const crearVenta = (datos) => API.post('/ventas', datos)
export const editarVenta = (id, datos) => API.put(`/ventas/${id}`, datos)
export const getVentasPorCliente = (usuarioId) => API.get(`/ventas/cliente/${usuarioId}`)

export const getCompras = () => API.get('/compras')
export const crearCompra = (datos) => API.post('/compras', datos)
export const editarCompra = (id, datos) => API.put(`/compras/${id}`, datos)
export const getComprasDisponibles = () => API.get('/compras/disponibles')


export const getGastos = () => API.get('/gastos')
export const crearGasto = (datos) => API.post('/gastos', datos)
export const editarGasto = (id, datos) => API.put(`/gastos/${id}`, datos)

export const getCuentasCobro = () => API.get('/cuentas-cobro')
export const getCuentasPendientes = () => API.get('/cuentas-cobro/pendientes')
export const getCuentasPorCliente = (id) => API.get(`/cuentas-cobro/cliente/${id}`)
export const marcarComoPagada = (id) => API.put(`/cuentas-cobro/${id}/pagar`)
export const generarPDF = (id) => API.get(`/cuentas-cobro/${id}/pdf`)

export const getCitas = () => API.get('/citas')
export const getCitasPendientes = () => API.get('/citas/pendientes')
export const crearCita = (datos) => API.post('/citas', datos)
export const actualizarEstadoCita = (id, datos) => API.put(`/citas/${id}/estado`, datos)
export const cancelarCita = (id) => API.put(`/citas/${id}/cancelar`)

export const getServiciosPorCliente = (id) => API.get(`/servicios/cliente/${id}`)
export const getCitasPorCliente = (id) => API.get(`/citas/cliente/${id}`)

export const getEmpresas = () => API.get('/empresas')
export const crearEmpresa = (datos) => API.post('/empresas', datos)
export const editarEmpresa = (id, datos) => API.put(`/empresas/${id}`, datos)

export const getProveedores = () => API.get('/proveedores')
export const crearProveedor = (datos) => API.post('/proveedores', datos)
export const editarProveedor = (id, datos) => API.put(`/proveedores/${id}`, datos)

export const toggleNotificaciones = (id) => API.put(`/clientes/${id}/notificaciones`)

export const getConfigRecordatorios = () => API.get('/config-recordatorios')
export const actualizarConfigRecordatorios = (data) => API.put('/config-recordatorios', data)

export const agregarStock = (id, data) => API.put(`/compras/${id}/stock`, data)

export default API