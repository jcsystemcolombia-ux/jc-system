import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getServicios, editarServicio, getClientes, getVentasPorCliente, getComprasDisponibles, getCompras } from '../../services/api'
import DarkSelect from '../../components/DarkSelect'


const estados = ['pendiente', 'completado', 'garantia', 'cancelado']

const tiposServicio = [
  'Soporte Técnico',
  'Instalación Sistema Operativo',
  'Reparación de Portátil',
  'Instalación de Programas',
  'Configuración de Red',
  'Mantenimiento Preventivo'
]

const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)

const Servicios = () => {
  const [servicios, setServicios] = useState([])
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [modalGarantia, setModalGarantia] = useState(false)
  const [servicioEditando, setServicioEditando] = useState(null)
  const [servicioDetalle, setServicioDetalle] = useState(null)
  const [servicioGarantia, setServicioGarantia] = useState(null)
  const [ventasCliente, setVentasCliente] = useState([])
  const [formGarantia, setFormGarantia] = useState({ garantiaVentaId: '', garantiaValor: '0', descripcionRepuesto: '' })
  const [formEditar, setFormEditar] = useState({
    tipo: '', descripcion: '', valor: '', pagoInversion: '', fechaServicio: '', estado: '', informeTecnico: ''
  })
  const [error, setError] = useState('')
  const [errorGarantia, setErrorGarantia] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardandoGarantia, setGuardandoGarantia] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [comprasDisponibles, setComprasDisponibles] = useState([])
  const [todasCompras, setTodasCompras] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])


const cargarDatos = async () => {
  try {
    const [serviciosRes, clientesRes, comprasDisponiblesRes, comprasRes] = await Promise.all([
      getServicios(), getClientes(), getComprasDisponibles(), getCompras()
    ])
    
    setServicios(serviciosRes.data)
    setClientes(clientesRes.data)
    setComprasDisponibles(comprasDisponiblesRes.data)
    setTodasCompras(comprasRes.data)
  } catch (error) {
    console.error('Error cargando datos:', error)
    console.error('Error detalle:', error.message)
  } finally {
    setCargando(false)
  }
}

  const cambiarFiltro = (setter, valor) => {
    setter(valor)
    setPaginaActual(1)
  }

  const abrirModalEditar = (servicio) => {
    setServicioEditando(servicio)
    setFormEditar({
      tipo: servicio.tipo,
      descripcion: servicio.descripcion,
      valor: servicio.valor || '',
      pagoInversion: servicio.pagoInversion || '',
      fechaServicio: servicio.fechaServicio ? servicio.fechaServicio.split('T')[0] : '',
      estado: servicio.estado,
      informeTecnico: servicio.informeTecnico || ''
    })
    setError('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setServicioEditando(null)
    setError('')
  }

  const handleEditar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      if (formEditar.estado === 'garantia') {
        const ventas = await getVentasPorCliente(servicioEditando.usuarioId)
        setVentasCliente(ventas.data)
        setServicioGarantia({ ...servicioEditando, ...formEditar })
        setFormGarantia({ garantiaVentaId: '', garantiaValor: '0', descripcionRepuesto: '', compraRepuestoId: '' })
        setModalAbierto(false)
        setModalGarantia(true)
        setGuardando(false)
        return
      }
      await editarServicio(servicioEditando.id, formEditar)
      await cargarDatos()
      cerrarModal()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al editar servicio')
    } finally {
      setGuardando(false)
    }
  }

 const handleGuardarGarantia = async (e) => {
  e.preventDefault()
  setGuardandoGarantia(true)
  setErrorGarantia('')
  try {
    await editarServicio(servicioGarantia.id, {
      ...formEditar,
      estado: 'garantia',
      garantiaVentaId: formGarantia.garantiaVentaId || null,
      garantiaValor: formGarantia.garantiaValor || 0,
      descripcionRepuesto: formGarantia.descripcionRepuesto || '',
      compraRepuestoId: formGarantia.compraRepuestoId || null
    })
    await cargarDatos()
    setModalGarantia(false)
    setServicioGarantia(null)
  } catch (err) {
    setErrorGarantia(err.response?.data?.mensaje || 'Error al guardar garantía')
  } finally {
    setGuardandoGarantia(false)
  }
}

  const colorEstado = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-100 text-yellow-700',
      completado: 'bg-green-100 text-green-700',
      garantia: 'bg-blue-100 text-blue-700',
      cancelado: 'bg-red-100 text-red-700'
    }
    return colores[estado] || 'bg-gray-100 text-gray-700'
  }

  const serviciosFiltrados = servicios.filter(s => {
  const fecha = new Date(s.createdAt)
  const cumpleEstado = filtroEstado ? s.estado === filtroEstado : true
  const cumpleMes = filtroMes ? fecha.getMonth() + 1 === parseInt(filtroMes) : true
  const cumpleAnio = filtroAnio ? fecha.getFullYear() === parseInt(filtroAnio) : true
  const termino = busqueda.toLowerCase()
  const cumpleBusqueda = busqueda ? (
    s.usuario?.nombre?.toLowerCase().includes(termino) ||
    s.usuario?.empresa?.nombre?.toLowerCase().includes(termino) ||
    s.tipo?.toLowerCase().includes(termino)
  ) : true
  return cumpleEstado && cumpleMes && cumpleAnio && cumpleBusqueda
})

  const totalIngresos = serviciosFiltrados
    .filter(s => s.estado === 'completado')
    .reduce((acc, s) => acc + s.valor, 0)

  const totalGanancia = serviciosFiltrados
    .filter(s => s.estado === 'completado')
    .reduce((acc, s) => acc + (s.valor - s.pagoInversion), 0)

  const totalPaginas = Math.ceil(serviciosFiltrados.length / porPagina)
  const serviciosPaginados = serviciosFiltrados.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  )

  const Paginacion = () => (
    <div className="bg-white rounded-2xl shadow px-6 py-4 flex flex-wrap items-center justify-between gap-4 mt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Mostrar</span>
        <select
          value={porPagina}
          onChange={(e) => { setPorPagina(parseInt(e.target.value)); setPaginaActual(1) }}
          className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={serviciosFiltrados.length}>Todos</option>
        </select>
        <span className="text-sm text-gray-500">registros</span>
      </div>

      <span className="text-sm text-gray-500">
        Mostrando {serviciosFiltrados.length === 0 ? 0 : Math.min((paginaActual - 1) * porPagina + 1, serviciosFiltrados.length)}–{Math.min(paginaActual * porPagina, serviciosFiltrados.length)} de {serviciosFiltrados.length} registros
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
          disabled={paginaActual === 1}
          className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
          .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
            acc.push(p)
            return acc
          }, [])
          .map((p, idx) => p === '...' ? (
            <span key={idx} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => setPaginaActual(p)}
              className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${
                paginaActual === p
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))
        }
        <button
          onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
          disabled={paginaActual === totalPaginas || totalPaginas === 0}
          className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>
    </div>
  )

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Servicios</h1>
          <p className="text-gray-500">Gestión de servicios técnicos</p>
        </div>
      </div>


      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => cambiarFiltro(setFiltroEstado, '')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Todos</button>
          <button onClick={() => cambiarFiltro(setFiltroEstado, 'pendiente')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'pendiente' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Pendiente</button>
          <button onClick={() => cambiarFiltro(setFiltroEstado, 'completado')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'completado' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Completado</button>
          <button onClick={() => cambiarFiltro(setFiltroEstado, 'garantia')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'garantia' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Garantía</button>
          <button onClick={() => cambiarFiltro(setFiltroEstado, 'cancelado')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'cancelado' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Cancelado</button>
        </div>
        <select value={filtroMes} onChange={(e) => cambiarFiltro(setFiltroMes, e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Todos los meses</option>
          <option value="1">Enero</option>
          <option value="2">Febrero</option>
          <option value="3">Marzo</option>
          <option value="4">Abril</option>
          <option value="5">Mayo</option>
          <option value="6">Junio</option>
          <option value="7">Julio</option>
          <option value="8">Agosto</option>
          <option value="9">Septiembre</option>
          <option value="10">Octubre</option>
          <option value="11">Noviembre</option>
          <option value="12">Diciembre</option>
        </select>
        <select value={filtroAnio} onChange={(e) => cambiarFiltro(setFiltroAnio, e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Todos los años</option>
          {anios.map((anio) => (
            <option key={anio} value={anio}>{anio}</option>
          ))}
        </select>
        
        <input
          type="text"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1) }}
          placeholder="🔍 Buscar..."
          className="w-64 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

      </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">Cantidad de Servicios</p>
                <p className="text-xl font-bold text-blue-600">{serviciosFiltrados.length}</p>
              </div>
              <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">Total Servicios</p>
                <p className="text-xl font-bold text-green-600">${totalIngresos.toLocaleString('es-CO')}</p>
              </div>
                <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">Pago Inversión</p>
                <p className="text-xl font-bold text-purple-600">${serviciosFiltrados.reduce((acc, s) => acc + (s.pagoInversion || 0), 0).toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">Total Ganancia</p>
                <p className="text-xl font-bold text-emerald-600">${totalGanancia.toLocaleString('es-CO')}</p>
              </div>
            </div>

      {cargando ? (
        <div className="text-center text-gray-500 py-10">Cargando...</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500"># Servicio</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Empresa / Cliente</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Valor</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serviciosPaginados.map((servicio) => (
                  <tr key={servicio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">#{servicio.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <p className="font-medium">{servicio.usuario?.empresa?.nombre || servicio.usuario?.nombre}</p>
                      <p className="text-xs text-gray-500">{servicio.usuario?.nombre}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{servicio.tipo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {servicio.fechaServicio ? new Date(servicio.fechaServicio).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {servicio.valor > 0 ? `$${servicio.valor.toLocaleString('es-CO')}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(servicio.estado)}`}>
                        {servicio.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => { setServicioDetalle(servicio); setModalDetalle(true) }} className="text-green-600 hover:text-green-800 text-sm font-medium">Ver</button>
                      <button onClick={() => abrirModalEditar(servicio)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                    </td>
                  </tr>
                ))}
                {serviciosPaginados.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">No hay servicios registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion />
        </>
      )}

      {/* Modal detalle */}
      {modalDetalle && servicioDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalle del Servicio</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase">Cliente</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{servicioDetalle.usuario?.nombre}</p>
                  {servicioDetalle.usuario?.empresa && (
                    <span className="text-xs text-gray-500">— Empresa: <strong className="text-gray-700">{servicioDetalle.usuario.empresa.nombre}</strong></span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Tipo</p>
                <p className="text-sm text-gray-800">{servicioDetalle.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Descripción</p>
                <p className="text-sm text-gray-800">{servicioDetalle.descripcion}</p>
              </div>
              {servicioDetalle.informeTecnico && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Informe Técnico</p>
                  <p className="text-sm text-gray-800">{servicioDetalle.informeTecnico}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase">Fecha del Servicio</p>
                <p className="text-sm text-gray-800">
                  {servicioDetalle.fechaServicio ? new Date(servicioDetalle.fechaServicio).toLocaleDateString('es-CO') : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Valor</p>
                <p className="text-sm text-gray-800">
                  {servicioDetalle.valor > 0 ? `$${servicioDetalle.valor.toLocaleString('es-CO')}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Estado</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(servicioDetalle.estado)}`}>
                  {servicioDetalle.estado}
                </span>
              </div>
           {servicioDetalle.estado === 'garantia' && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <p className="text-xs text-blue-700 uppercase font-medium">Información de Garantía</p>
                {servicioDetalle.garantiaVenta && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Producto en garantía</p>
                    <p className="text-sm text-gray-800">
                      {servicioDetalle.garantiaVenta.items?.map(i => i.producto).join(', ')}
                      {servicioDetalle.garantiaVenta.items?.[0]?.tipoProducto && ` — ${servicioDetalle.garantiaVenta.items[0].tipoProducto}`}
                      {servicioDetalle.garantiaVenta.items?.[0]?.condicion && ` (${servicioDetalle.garantiaVenta.items[0].condicion})`}
                    </p>
                  </div>
                )}
                {servicioDetalle.compraRepuestoId && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Repuesto utilizado</p>
                    <p className="text-sm text-gray-800">
                      {todasCompras.find(c => c.id === servicioDetalle.compraRepuestoId)?.producto || `Compra #${servicioDetalle.compraRepuestoId}`}
                    </p>
                  </div>
                )}
                {servicioDetalle.garantiaValor > 0 ? (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Valor Repuesto</p>
                    <p className="text-sm font-bold text-red-500">${servicioDetalle.garantiaValor.toLocaleString('es-CO')}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Costo</p>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Sin costo de repuesto</span>
                  </div>
                )}
              </div>
            )}
              {servicioDetalle.cuentaCobro && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Cuenta de Cobro</p>
                  <p className="text-sm text-gray-800">#{servicioDetalle.cuentaCobro.numeroCuenta} — {servicioDetalle.cuentaCobro.estado}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setModalDetalle(false); abrirModalEditar(servicioDetalle) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Editar</button>
              <button onClick={() => setModalDetalle(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {modalAbierto && servicioEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Editar Servicio</h2>
            {error && <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleEditar} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Servicio *</label>
                <select
                  value={formEditar.tipo}
                  onChange={(e) => setFormEditar({ ...formEditar, tipo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposServicio.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                <textarea
                  value={formEditar.descripcion}
                  onChange={(e) => setFormEditar({ ...formEditar, descripcion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Informe Técnico</label>
                <textarea
                  value={formEditar.informeTecnico}
                  onChange={(e) => setFormEditar({ ...formEditar, informeTecnico: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe qué se hizo en el servicio..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <input
                    type="number"
                    value={formEditar.valor}
                    onChange={(e) => setFormEditar({ ...formEditar, valor: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pago Inversión</label>
                  <input
                    type="number"
                    value={formEditar.pagoInversion}
                    onChange={(e) => setFormEditar({ ...formEditar, pagoInversion: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
              {formEditar.valor && parseFloat(formEditar.valor) > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg px-4 py-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Total Servicio:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-100">
                        ${parseFloat(formEditar.valor).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-300">Pago Inversión:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        ${(parseFloat(formEditar.pagoInversion) || 0).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-300">Ganancia:</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ${(parseFloat(formEditar.valor) - (parseFloat(formEditar.pagoInversion) || 0)).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Servicio</label>
                  <input
                    type="date"
                    value={formEditar.fechaServicio}
                    onChange={(e) => setFormEditar({ ...formEditar, fechaServicio: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select
                    value={formEditar.estado}
                    onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {estados.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formEditar.estado === 'garantia' && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">Al guardar como garantía se abrirá el registro de garantía</p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={guardando} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Actualizar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  {/* Modal garantía */}
{modalGarantia && servicioGarantia && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Registro de Garantía</h2>
        <button onClick={() => setModalGarantia(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      <div className="bg-blue-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-blue-700 font-medium">Cliente: {servicioGarantia.usuario?.nombre || clientes.find(c => c.id === servicioGarantia.usuarioId)?.nombre}</p>
        <p className="text-xs text-blue-600">Servicio: {servicioGarantia.tipo}</p>
      </div>
      {errorGarantia && <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{errorGarantia}</div>}
      <form onSubmit={handleGuardarGarantia} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Producto en garantía</label>
          <DarkSelect
            options={ventasCliente.map((v) => ({
              value: v.id,
              label: `${v.items?.map(i => i.producto).join(', ') || 'Sin productos'} — $${(v.items?.reduce((acc, i) => acc + (i.valorVenta * (i.cantidad || 1)), 0) || 0).toLocaleString('es-CO')} — ${new Date(v.createdAt).toLocaleDateString('es-CO')}`
            }))}
            onChange={(opcion) => setFormGarantia({ ...formGarantia, garantiaVentaId: opcion?.value || '' })}
            placeholder="Seleccionar producto vendido al cliente..."
            noOptionsMessage={() => 'No hay productos vendidos a este cliente'}
            isClearable
          />
          <p className="text-xs text-gray-400 mt-1">Opcional — selecciona el producto al que se le aplica la garantía</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Repuesto comprado</label>
          <DarkSelect
            options={comprasDisponibles.map((c) => ({
              value: c.id,
              label: `${c.producto} — $${c.valorUnitario.toLocaleString('es-CO')} — Disp: ${c.cantidadDisponible}`
            }))}
            onChange={(opcion) => {
              if (opcion) {
                const compra = comprasDisponibles.find(c => c.id === opcion.value)
                setFormGarantia({
                  ...formGarantia,
                  compraRepuestoId: compra.id,
                  descripcionRepuesto: compra.producto,
                  garantiaValor: compra.valorUnitario
                })
              } else {
                setFormGarantia({ ...formGarantia, compraRepuestoId: '', descripcionRepuesto: '', garantiaValor: '0' })
              }
            }}
            placeholder="Seleccionar repuesto del inventario..."
            noOptionsMessage={() => 'No hay repuestos disponibles'}
            isClearable
          />
          <p className="text-xs text-gray-400 mt-1">Opcional — selecciona el repuesto comprado para la garantía</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor del repuesto</label>
          <input
            type="number"
            value={formGarantia.garantiaValor}
            onChange={(e) => setFormGarantia({ ...formGarantia, garantiaValor: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
          />
          <p className="text-xs text-gray-400 mt-1">Si es mayor a $0 se registrará automáticamente en Gastos como Garantía</p>
        </div>
        {parseFloat(formGarantia.garantiaValor) > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700 dark:text-yellow-200 font-medium">⚠️ Se generará un gasto de ${parseFloat(formGarantia.garantiaValor).toLocaleString('es-CO')} en JC System / Garantias</p>
            {formGarantia.descripcionRepuesto && (
              <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">Descripción: {formGarantia.descripcionRepuesto}</p>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => setModalGarantia(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button type="submit" disabled={guardandoGarantia} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
            {guardandoGarantia ? 'Guardando...' : 'Registrar Garantía'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </AdminLayout>
  )
}

export default Servicios