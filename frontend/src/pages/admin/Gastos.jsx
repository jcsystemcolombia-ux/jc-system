import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getGastos, crearGasto, editarGasto } from '../../services/api'
import InputMoneda from '../../components/InputMoneda'

const tiposGasto = ['JC System', 'Personal']
const categoriasGasto = ['Obligacion', 'Mercado', 'Transporte', 'Alimentacion', 'Entretenimiento', 'Gastos JC', 'Otros']
const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)

const Gastos = () => {
  const [gastos, setGastos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [gastoEditando, setGastoEditando] = useState(null)
  const [gastoDetalle, setGastoDetalle] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [form, setForm] = useState({
    tipo: '', categoria: '', valor: '', descripcion: '', fecha: ''
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarGastos()
  }, [])

  const cargarGastos = async () => {
    try {
      const { data } = await getGastos()
      setGastos(data)
    } catch (error) {
      console.error('Error cargando gastos:', error)
    } finally {
      setCargando(false)
    }
  }

  const cambiarFiltro = (setter, valor) => {
    setter(valor)
    setPaginaActual(1)
  }

  const abrirModalCrear = () => {
    setGastoEditando(null)
    setForm({ tipo: '', categoria: '', valor: '', descripcion: '', fecha: '' })
    setError('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (gasto) => {
    setGastoEditando(gasto)
    setForm({
      tipo: gasto.tipo,
      categoria: gasto.categoria,
      valor: gasto.valor,
      descripcion: gasto.descripcion || '',
      fecha: gasto.fecha ? gasto.fecha.split('T')[0] : ''
    })
    setError('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setGastoEditando(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      if (gastoEditando) {
        await editarGasto(gastoEditando.id, form)
      } else {
        await crearGasto(form)
      }
      await cargarGastos()
      cerrarModal()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar gasto')
    } finally {
      setGuardando(false)
    }
  }

const gastosFiltrados = gastos.filter(g => {
  const fecha = new Date(g.fecha)
  const cumpleTipo = filtroTipo ? g.tipo === filtroTipo : true
  const cumpleMes = filtroMes ? fecha.getMonth() + 1 === parseInt(filtroMes) : true
  const cumpleAnio = filtroAnio ? fecha.getFullYear() === parseInt(filtroAnio) : true
  const termino = busqueda.toLowerCase()
  const cumpleBusqueda = busqueda ? (
    g.tipo?.toLowerCase().includes(termino) ||
    g.categoria?.toLowerCase().includes(termino) ||
    g.descripcion?.toLowerCase().includes(termino)
  ) : true
  return cumpleTipo && cumpleMes && cumpleAnio && cumpleBusqueda
})

  const totalFiltrado = gastosFiltrados.reduce((acc, g) => acc + g.valor, 0)

  const totalPaginas = Math.ceil(gastosFiltrados.length / porPagina)
  const gastosPaginados = gastosFiltrados.slice(
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
          <option value={gastosFiltrados.length}>Todos</option>
        </select>
        <span className="text-sm text-gray-500">registros</span>
      </div>
      <span className="text-sm text-gray-500">
        Mostrando {gastosFiltrados.length === 0 ? 0 : Math.min((paginaActual - 1) * porPagina + 1, gastosFiltrados.length)}–{Math.min(paginaActual * porPagina, gastosFiltrados.length)} de {gastosFiltrados.length} registros
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
          <h1 className="text-2xl font-bold text-gray-800">Gastos</h1>
          <p className="text-gray-500">Registro de gastos del negocio y personales</p>
        </div>
        <button onClick={abrirModalCrear} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Nuevo Gasto
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-2">
          <button onClick={() => cambiarFiltro(setFiltroTipo, '')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroTipo === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Todos</button>
          {tiposGasto.map((tipo) => (
            <button key={tipo} onClick={() => cambiarFiltro(setFiltroTipo, tipo)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroTipo === tipo ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{tipo}</button>
          ))}
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
    <p className="text-sm text-gray-500">Cantidad de Gastos</p>
    <p className="text-xl font-bold text-blue-600">{gastosFiltrados.length}</p>
  </div>
  <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
    <p className="text-sm text-gray-500">Total Gastos</p>
    <p className="text-xl font-bold text-red-500">${totalFiltrado.toLocaleString('es-CO')}</p>
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Categoría</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Descripción</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Valor</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gastosPaginados.map((gasto) => (
                  <tr key={gasto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(gasto.fecha).toLocaleDateString('es-CO')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${gasto.tipo === 'JC System' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {gasto.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{gasto.categoria}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{gasto.descripcion || '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-500">${gasto.valor.toLocaleString('es-CO')}</td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => { setGastoDetalle(gasto); setModalDetalle(true) }} className="text-green-600 hover:text-green-800 text-sm font-medium">Ver</button>
                      <button onClick={() => abrirModalEditar(gasto)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                    </td>
                  </tr>
                ))}
                {gastosPaginados.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-gray-400">No hay gastos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion />
        </>
      )}

      {/* Modal detalle */}
      {modalDetalle && gastoDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalle del Gasto</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Tipo</p>
                  <p className="text-sm font-medium text-gray-800">{gastoDetalle.tipo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Categoría</p>
                  <p className="text-sm text-gray-800">{gastoDetalle.categoria}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Valor</p>
                <p className="text-xl font-bold text-red-500">${gastoDetalle.valor.toLocaleString('es-CO')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Descripción</p>
                <p className="text-sm text-gray-800">{gastoDetalle.descripcion || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Fecha</p>
                <p className="text-sm text-gray-800">{new Date(gastoDetalle.fecha).toLocaleDateString('es-CO')}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setModalDetalle(false); abrirModalEditar(gastoDetalle) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Editar</button>
              <button onClick={() => setModalDetalle(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {gastoEditando ? 'Editar Gasto' : 'Nuevo Gasto'}
            </h2>
            {error && <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {tiposGasto.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {categoriasGasto.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                  <InputMoneda
                    value={form.valor}
                    onChange={(val) => setForm({ ...form, valor: val })}
                    placeholder="$0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del gasto..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={guardando} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : gastoEditando ? 'Actualizar' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default Gastos