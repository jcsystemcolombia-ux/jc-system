import { useState, useEffect } from 'react'
import ClienteLayout from '../../components/ClienteLayout'
import { useAuth } from '../../context/AuthContext'
import { getServiciosPorCliente } from '../../services/api'

const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)

const colorEstado = (estado) => {
  const colores = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    completado: 'bg-green-100 text-green-700',
    garantia: 'bg-blue-100 text-blue-700',
    cancelado: 'bg-red-100 text-red-700'
  }
  return colores[estado] || 'bg-gray-100 text-gray-700'
}

const MisServicios = () => {
  const { usuario } = useAuth()
  const [servicios, setServicios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [servicioDetalle, setServicioDetalle] = useState(null)

  useEffect(() => {
    const cargarServicios = async () => {
      try {
        const { data } = await getServiciosPorCliente(usuario.id)
        setServicios(data)
      } catch (error) {
        console.error('Error cargando servicios:', error)
      } finally {
        setCargando(false)
      }
    }
    if (usuario) cargarServicios()
  }, [usuario])

  const cambiarFiltro = (setter, valor) => {
    setter(valor)
    setPaginaActual(1)
  }

  const serviciosFiltrados = servicios.filter(s => {
    const fecha = new Date(s.createdAt)
    const cumpleEstado = filtroEstado ? s.estado === filtroEstado : true
    const cumpleMes = filtroMes ? fecha.getMonth() + 1 === parseInt(filtroMes) : true
    const cumpleAnio = filtroAnio ? fecha.getFullYear() === parseInt(filtroAnio) : true
    const termino = busqueda.toLowerCase()
    const cumpleBusqueda = busqueda ? (
        s.descripcion?.toLowerCase().includes(termino) ||
        s.usuario?.nombre?.toLowerCase().includes(termino)
    ) : true
    return cumpleEstado && cumpleMes && cumpleAnio && cumpleBusqueda
  })

  const totalServicios = serviciosFiltrados
    .filter(s => s.estado === 'completado')
    .reduce((acc, s) => acc + s.valor, 0)

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
              className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${paginaActual === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}
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
    <ClienteLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mis Servicios</h1>
        <p className="text-gray-500">Historial de servicios realizados</p>
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
          className="w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Cantidad de Servicios</p>
          <p className="text-xl font-bold text-blue-600">{serviciosFiltrados.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Total Servicios</p>
          <p className="text-xl font-bold text-green-600">${totalServicios.toLocaleString('es-CO')}</p>
        </div>
      </div>

      {cargando ? (
        <div className="text-center text-gray-500 py-10">Cargando...</div>
      ) : (
        <>
          <div className="space-y-4">
            {serviciosPaginados.map((servicio) => (
              <div key={servicio.id} className="bg-white rounded-2xl shadow p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-xl">🔧</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{servicio.tipo}</p>
                      {servicio.usuario && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {servicio.usuario.nombre}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {servicio.fechaServicio ? new Date(servicio.fechaServicio).toLocaleDateString('es-CO') : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">
                      {servicio.valor > 0 ? `$${servicio.valor.toLocaleString('es-CO')}` : '—'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(servicio.estado)}`}>
                    {servicio.estado}
                  </span>
                  <button
                    onClick={() => { setServicioDetalle(servicio); setModalDetalle(true) }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver
                  </button>
                </div>
              </div>
            ))}
            {serviciosPaginados.length === 0 && (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                No hay servicios registrados
              </div>
            )}
          </div>
          <Paginacion />
        </>
      )}

      {modalDetalle && servicioDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalle del Servicio</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase">Tipo</p>
                <p className="text-sm font-medium text-gray-800">{servicioDetalle.tipo}</p>
              </div>
              {servicioDetalle.usuario && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Solicitado por</p>
                  <p className="text-sm text-gray-800">{servicioDetalle.usuario.nombre}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase">Descripción</p>
                <p className="text-sm text-gray-800">{servicioDetalle.descripcion}</p>
              </div>
              {servicioDetalle.informeTecnico && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700 uppercase font-medium mb-1">Informe Técnico</p>
                  <p className="text-sm text-blue-800">{servicioDetalle.informeTecnico}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Fecha</p>
                  <p className="text-sm text-gray-800">
                    {servicioDetalle.fechaServicio ? new Date(servicioDetalle.fechaServicio).toLocaleDateString('es-CO') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Valor</p>
                  <p className="text-sm font-bold text-gray-800">
                    {servicioDetalle.valor > 0 ? `$${servicioDetalle.valor.toLocaleString('es-CO')}` : 'Por definir'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Estado</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(servicioDetalle.estado)}`}>
                  {servicioDetalle.estado}
                </span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setModalDetalle(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </ClienteLayout>
  )
}

export default MisServicios