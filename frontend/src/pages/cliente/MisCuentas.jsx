import { useState, useEffect } from 'react'
import ClienteLayout from '../../components/ClienteLayout'
import { useAuth } from '../../context/AuthContext'
import { getCuentasPorCliente, generarPDF } from '../../services/api'

const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)

const MisCuentas = () => {
  const { usuario } = useAuth()
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [cuentaDetalle, setCuentaDetalle] = useState(null)

  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        const { data } = await getCuentasPorCliente(usuario.id)
        setCuentas(data)
      } catch (error) {
        console.error('Error cargando cuentas:', error)
      } finally {
        setCargando(false)
      }
    }
    if (usuario) cargarCuentas()
  }, [usuario])

  const handleVerPDF = async (id) => {
    try {
      const { data } = await generarPDF(id)
      const ventana = window.open('', '_blank')
      ventana.document.write(data.html)
      ventana.document.close()
    } catch (error) {
      console.error('Error generando PDF:', error)
    }
  }

  const cambiarFiltro = (setter, valor) => {
    setter(valor)
    setPaginaActual(1)
  }

  const cuentasFiltradas = cuentas.filter(c => {
    const fecha = new Date(c.createdAt)
    const cumpleEstado = filtroEstado ? c.estado === filtroEstado : true
    const cumpleMes = filtroMes ? fecha.getMonth() + 1 === parseInt(filtroMes) : true
    const cumpleAnio = filtroAnio ? fecha.getFullYear() === parseInt(filtroAnio) : true
    const termino = busqueda.toLowerCase()
    const cumpleBusqueda = busqueda ? (
      c.numeroCuenta?.toString().includes(termino) ||
      c.usuario?.nombre?.toLowerCase().includes(termino) ||
      c.servicio?.tipo?.toLowerCase().includes(termino) ||
      c.venta?.producto?.toLowerCase().includes(termino)
    ) : true
    return cumpleEstado && cumpleMes && cumpleAnio && cumpleBusqueda
  })

  const totalPendiente = cuentasFiltradas.filter(c => c.estado === 'pendiente').reduce((acc, c) => acc + c.total, 0)
  const totalPagado = cuentasFiltradas.filter(c => c.estado === 'pagada').reduce((acc, c) => acc + c.total, 0)

  const mostrarPendiente = filtroEstado === '' || filtroEstado === 'pendiente'
  const mostrarPagado = filtroEstado === '' || filtroEstado === 'pagada'

  const totalPaginas = Math.ceil(cuentasFiltradas.length / porPagina)
  const cuentasPaginadas = cuentasFiltradas.slice(
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
          <option value={cuentasFiltradas.length}>Todos</option>
        </select>
        <span className="text-sm text-gray-500">registros</span>
      </div>
      <span className="text-sm text-gray-500">
        Mostrando {cuentasFiltradas.length === 0 ? 0 : Math.min((paginaActual - 1) * porPagina + 1, cuentasFiltradas.length)}–{Math.min(paginaActual * porPagina, cuentasFiltradas.length)} de {cuentasFiltradas.length} registros
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
        <h1 className="text-2xl font-bold text-gray-800">Mis Cuentas de Cobro</h1>
        <p className="text-gray-500">Historial de cobros y pagos</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-2">
          <button onClick={() => cambiarFiltro(setFiltroEstado, '')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Todas</button>
          <button onClick={() => cambiarFiltro(setFiltroEstado, 'pendiente')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'pendiente' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Pendientes</button>
          <button onClick={() => cambiarFiltro(setFiltroEstado, 'pagada')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'pagada' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Pagadas</button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {mostrarPendiente && totalPendiente > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-orange-800">Saldo pendiente por pagar</p>
              <p className="text-xs text-orange-600">Por favor realiza el pago a la brevedad</p>
            </div>
            <p className="text-xl font-bold text-orange-600">${totalPendiente.toLocaleString('es-CO')}</p>
          </div>
        )}
        {mostrarPagado && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-green-800">Total pagado</p>
              <p className="text-xs text-green-600">Historial de pagos realizados</p>
            </div>
            <p className="text-xl font-bold text-green-600">${totalPagado.toLocaleString('es-CO')}</p>
          </div>
        )}
      </div>

      {cargando ? (
        <div className="text-center text-gray-500 py-10">Cargando...</div>
      ) : (
        <>
          <div className="space-y-4">
            {cuentasPaginadas.map((cuenta) => (
              <div key={cuenta.id} className="bg-white rounded-2xl shadow p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${cuenta.estado === 'pagada' ? 'bg-green-100' : 'bg-orange-100'}`}>
                    {cuenta.estado === 'pagada' ? '✅' : '📄'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">Cuenta #{cuenta.numeroCuenta}</p>
                      {cuenta.usuario && cuenta.usuario.id !== usuario.id && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {cuenta.usuario.nombre}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {cuenta.servicio ? cuenta.servicio.tipo : cuenta.venta ? cuenta.venta.producto : '—'}
                    </p>
                    <div className="flex gap-2 items-center">
                      <p className="text-xs text-gray-400">{new Date(cuenta.createdAt).toLocaleDateString('es-CO')}</p>
                      {cuenta.fechaPago && (
                        <p className="text-xs text-green-600 font-medium">· Pagada: {new Date(cuenta.fechaPago).toLocaleDateString('es-CO')}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">${cuenta.total.toLocaleString('es-CO')}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cuenta.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {cuenta.estado}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCuentaDetalle(cuenta); setModalDetalle(true) }} className="text-green-600 hover:text-green-800 text-sm font-medium">Ver</button>
                    <button onClick={() => handleVerPDF(cuenta.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">PDF</button>
                  </div>
                </div>
              </div>
            ))}
            {cuentasPaginadas.length === 0 && (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">No hay cuentas de cobro</div>
            )}
          </div>
          <Paginacion />
        </>
      )}

      {modalDetalle && cuentaDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Cuenta #{cuentaDetalle.numeroCuenta}</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {cuentaDetalle.usuario && cuentaDetalle.usuario.id !== usuario.id && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Solicitado por</p>
                  <p className="text-sm font-medium text-gray-800">{cuentaDetalle.usuario.nombre}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase">Concepto</p>
                <p className="text-sm font-medium text-gray-800">
                  {cuentaDetalle.servicio ? cuentaDetalle.servicio.descripcion : cuentaDetalle.venta ? cuentaDetalle.venta.producto : '—'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Total</p>
                  <p className="text-xl font-bold text-gray-800">${cuentaDetalle.total.toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Estado</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cuentaDetalle.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {cuentaDetalle.estado}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Fecha Emisión</p>
                <p className="text-sm text-gray-800">{new Date(cuentaDetalle.createdAt).toLocaleDateString('es-CO')}</p>
              </div>
              {cuentaDetalle.fechaPago && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Fecha Pago</p>
                  <p className="text-sm text-green-600 font-medium">{new Date(cuentaDetalle.fechaPago).toLocaleDateString('es-CO')}</p>
                </div>
              )}
              {cuentaDetalle.estado === 'pendiente' && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">Datos para el pago</p>
                  <p className="text-sm text-blue-800">Bancolombia Ahorros</p>
                  <p className="text-sm text-blue-800">006-243435-73</p>
                  <p className="text-sm text-blue-800">Juan Camilo Echeverri Flórez</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => handleVerPDF(cuentaDetalle.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Ver PDF</button>
              <button onClick={() => setModalDetalle(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </ClienteLayout>
  )
}

export default MisCuentas