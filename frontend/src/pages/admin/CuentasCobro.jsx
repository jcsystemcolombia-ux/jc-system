import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getCuentasCobro, marcarComoPagada, generarPDF, getConfigRecordatorios, actualizarConfigRecordatorios } from '../../services/api'

const CuentasCobro = () => {
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [busqueda, setBusqueda] = useState('')
  const [modalDetalle, setModalDetalle] = useState(false)
  const [cuentaDetalle, setCuentaDetalle] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [modalConfig, setModalConfig] = useState(false)
  const [config, setConfig] = useState({ diasEspera: 3, frecuencia: 'diario', hora: 10, minutos: 0 })
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [cuentasRes, configRes] = await Promise.all([
        getCuentasCobro(),
        getConfigRecordatorios()
      ])
      setCuentas(cuentasRes.data)
      setConfig(configRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const cambiarFiltro = (setter, valor) => {
    setter(valor)
    setPaginaActual(1)
  }

  const handleMarcarPagada = async (id) => {
    setProcesando(true)
    try {
      await marcarComoPagada(id)
      await cargarDatos()
      setModalDetalle(false)
    } catch (error) {
      console.error('Error marcando como pagada:', error)
    } finally {
      setProcesando(false)
    }
  }

  const handleGenerarPDF = async (id) => {
    try {
      const { data } = await generarPDF(id)
      const ventana = window.open('', '_blank')
      ventana.document.write(data.html)
      ventana.document.close()
    } catch (error) {
      console.error('Error generando PDF:', error)
    }
  }

  const handleGuardarConfig = async (e) => {
    e.preventDefault()
    setGuardandoConfig(true)
    try {
      await actualizarConfigRecordatorios(config)
      setModalConfig(false)
    } catch (error) {
      console.error('Error guardando configuración:', error)
    } finally {
      setGuardandoConfig(false)
    }
  }

  const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)

  const cuentasFiltradas = cuentas.filter(c => {
    const fecha = new Date(c.createdAt)
    const cumpleEstado = filtroEstado ? c.estado === filtroEstado : true
    const cumpleMes = filtroMes ? fecha.getMonth() + 1 === parseInt(filtroMes) : true
    const cumpleAnio = filtroAnio ? fecha.getFullYear() === parseInt(filtroAnio) : true
    const termino = busqueda.toLowerCase()
    const cumpleBusqueda = busqueda ? (
      c.usuario?.nombre?.toLowerCase().includes(termino) ||
      c.usuario?.empresa?.nombre?.toLowerCase().includes(termino) ||
      c.numeroCuenta?.toString().includes(termino) ||
      c.servicio?.tipo?.toLowerCase().includes(termino) ||
      c.venta?.producto?.toLowerCase().includes(termino)
    ) : true
    return cumpleEstado && cumpleMes && cumpleAnio && cumpleBusqueda
  })

  const totalPendiente = cuentasFiltradas.filter(c => c.estado === 'pendiente').reduce((acc, c) => acc + c.total, 0)
  const totalPagado = cuentasFiltradas.filter(c => c.estado === 'pagada').reduce((acc, c) => acc + c.total, 0)

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
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cuentas de Cobro</h1>
          <p className="text-gray-500">Gestión de cobros a clientes</p>
        </div>
        <button
          onClick={() => setModalConfig(true)}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
        >
          ⚙️ Configurar Recordatorios
        </button>
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

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Cantidad de Cuentas</p>
          <p className="text-xl font-bold text-blue-600">{cuentasFiltradas.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Total por cobrar</p>
          <p className="text-xl font-bold text-orange-500">${totalPendiente.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Total Pagado</p>
          <p className="text-xl font-bold text-green-600">${totalPagado.toLocaleString('es-CO')}</p>
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500"># Cuenta</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Empresa / Cliente</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Concepto</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Total</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cuentasPaginadas.map((cuenta) => (
                  <tr key={cuenta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">#{cuenta.numeroCuenta}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <p className="font-medium">{cuenta.usuario?.empresa?.nombre || cuenta.usuario?.nombre}</p>
                      <p className="text-xs text-gray-500">{cuenta.usuario?.nombre}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                     {cuenta.servicio 
                        ? cuenta.servicio.tipo 
                        : cuenta.venta?.items?.length > 0 
                          ? cuenta.venta.items.map(i => 
                              i.cantidad > 1 ? `${i.producto} (x${i.cantidad})` : i.producto
                            ).join(', ')
                          : '—'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">${cuenta.total.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cuenta.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {cuenta.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <p>{new Date(cuenta.createdAt).toLocaleDateString('es-CO')}</p>
                      {cuenta.fechaPago && (
                        <p className="text-xs text-green-600 font-medium">
                          Pagada: {new Date(cuenta.fechaPago).toLocaleDateString('es-CO')}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => { setCuentaDetalle(cuenta); setModalDetalle(true) }} className="text-green-600 hover:text-green-800 text-sm font-medium">Ver</button>
                      <button onClick={() => handleGenerarPDF(cuenta.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">PDF</button>
                      {cuenta.estado === 'pendiente' && (
                        <button onClick={() => handleMarcarPagada(cuenta.id)} className="text-orange-600 hover:text-orange-800 text-sm font-medium">Pagada</button>
                      )}
                    </td>
                  </tr>
                ))}
                {cuentasPaginadas.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">No hay cuentas de cobro</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion />
        </>
      )}

      {/* Modal detalle */}
      {modalDetalle && cuentaDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Cuenta de Cobro #{cuentaDetalle.numeroCuenta}</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase">Cliente</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{cuentaDetalle.usuario?.nombre}</p>
                  {cuentaDetalle.usuario?.empresa && (
                    <span className="text-xs text-gray-500">— Empresa: <strong className="text-gray-700">{cuentaDetalle.usuario.empresa.nombre}</strong></span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">NIT / Cédula</p>
                <p className="text-sm text-gray-800">{cuentaDetalle.usuario?.nitCedula || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Concepto</p>
                <p className="text-sm text-gray-800">
             {cuentaDetalle.servicio 
                      ? cuentaDetalle.servicio.descripcion 
                      : cuentaDetalle.venta?.items?.length > 0 
                        ? cuentaDetalle.venta.items.map(i => 
                            i.cantidad > 1 ? `${i.producto} (x${i.cantidad})` : i.producto
                          ).join(', ')
                        : '—'
                    }
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Fecha Emisión</p>
                  <p className="text-sm text-gray-800">{new Date(cuentaDetalle.createdAt).toLocaleDateString('es-CO')}</p>
                </div>
                {cuentaDetalle.fechaPago && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Fecha Pago</p>
                    <p className="text-sm text-gray-800">{new Date(cuentaDetalle.fechaPago).toLocaleDateString('es-CO')}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              {cuentaDetalle.estado === 'pendiente' && (
                <button onClick={() => handleMarcarPagada(cuentaDetalle.id)} disabled={procesando} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50">
                  {procesando ? 'Procesando...' : 'Marcar como Pagada'}
                </button>
              )}
              <button onClick={() => handleGenerarPDF(cuentaDetalle.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Ver PDF</button>
              <button onClick={() => setModalDetalle(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal configuración recordatorios */}
      {modalConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Configurar Recordatorios</h2>
              <button onClick={() => setModalConfig(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleGuardarConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Días de espera antes del primer recordatorio
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.diasEspera}
                  onChange={(e) => setConfig({ ...config, diasEspera: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Días desde la creación de la cuenta sin pagar</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia de recordatorios
                </label>
                <select
                  value={config.frecuencia}
                  onChange={(e) => setConfig({ ...config, frecuencia: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal (todos los lunes)</option>
                </select>
              </div>
         <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora de envío</label>
                  <select
                    value={config.hora}
                    onChange={(e) => setConfig({ ...config, hora: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minutos</label>
                  <select
                    value={config.minutos}
                    onChange={(e) => setConfig({ ...config, minutos: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={0}>:00</option>
                    <option value={5}>:05</option>
                    <option value={10}>:10</option>
                    <option value={15}>:15</option>
                    <option value={20}>:20</option>
                    <option value={25}>:25</option>
                    <option value={30}>:30</option>
                    <option value={35}>:35</option>
                    <option value={40}>:40</option>
                    <option value={45}>:45</option>
                    <option value={50}>:50</option>
                    <option value={55}>:55</option>
                  </select>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-700 font-medium">Configuración actual</p>
              <p className="text-xs text-blue-600">
                Se enviará recordatorio a cuentas con más de <strong>{config.diasEspera} días</strong> sin pagar,
                de forma <strong>{config.frecuencia === 'diario' ? 'diaria' : 'semanal (lunes)'}</strong> a las <strong>{config.hora}:{config.minutos === 0 ? '00' : config.minutos < 10 ? `0${config.minutos}` : config.minutos}</strong>
              </p>
            </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalConfig(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={guardandoConfig} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {guardandoConfig ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default CuentasCobro