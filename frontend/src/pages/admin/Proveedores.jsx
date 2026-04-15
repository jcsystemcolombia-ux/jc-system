import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getProveedores, crearProveedor, editarProveedor } from '../../services/api'

const tiposProveedor = ['Persona Natural', 'Empresa']

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [proveedorEditando, setProveedorEditando] = useState(null)
  const [proveedorDetalle, setProveedorDetalle] = useState(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({
    nombre: '', telefono: '', nit: '', direccion: '', tipo: ''
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarProveedores()
  }, [])

  const cargarProveedores = async () => {
    try {
      const { data } = await getProveedores()
      setProveedores(data)
    } catch (error) {
      console.error('Error cargando proveedores:', error)
    } finally {
      setCargando(false)
    }
  }

  const abrirModalCrear = () => {
    setProveedorEditando(null)
    setForm({ nombre: '', telefono: '', nit: '', direccion: '', tipo: '' })
    setError('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (proveedor) => {
    setProveedorEditando(proveedor)
    setForm({
      nombre: proveedor.nombre,
      telefono: proveedor.telefono || '',
      nit: proveedor.nit || '',
      direccion: proveedor.direccion || '',
      tipo: proveedor.tipo
    })
    setError('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setProveedorEditando(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      if (proveedorEditando) {
        await editarProveedor(proveedorEditando.id, form)
      } else {
        await crearProveedor(form)
      }
      await cargarProveedores()
      cerrarModal()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar proveedor')
    } finally {
      setGuardando(false)
    }
  }

  const proveedoresFiltrados = proveedores.filter(p => {
    const termino = busqueda.toLowerCase()
    return busqueda ? (
      p.nombre?.toLowerCase().includes(termino) ||
      p.nit?.toLowerCase().includes(termino) ||
      p.tipo?.toLowerCase().includes(termino)
    ) : true
  })

  const totalPaginas = Math.ceil(proveedoresFiltrados.length / porPagina)
  const proveedoresPaginados = proveedoresFiltrados.slice(
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
          <option value={proveedoresFiltrados.length}>Todos</option>
        </select>
        <span className="text-sm text-gray-500">registros</span>
      </div>
      <span className="text-sm text-gray-500">
        Mostrando {proveedoresFiltrados.length === 0 ? 0 : Math.min((paginaActual - 1) * porPagina + 1, proveedoresFiltrados.length)}–{Math.min(paginaActual * porPagina, proveedoresFiltrados.length)} de {proveedoresFiltrados.length} registros
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
          <h1 className="text-2xl font-bold text-gray-800">Proveedores</h1>
          <p className="text-gray-500">Gestión de proveedores</p>
        </div>
        <button onClick={abrirModalCrear} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Nuevo Proveedor
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1) }}
          placeholder="🔍 Buscar por nombre, NIT o tipo..."
          className="w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {cargando ? (
        <div className="text-center text-gray-500 py-10">Cargando...</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">NIT / Cédula</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Teléfono</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proveedoresPaginados.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{proveedor.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${proveedor.tipo === 'Empresa' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {proveedor.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{proveedor.nit || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{proveedor.telefono || '—'}</td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => { setProveedorDetalle(proveedor); setModalDetalle(true) }} className="text-green-600 hover:text-green-800 text-sm font-medium">Ver</button>
                      <button onClick={() => abrirModalEditar(proveedor)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                    </td>
                  </tr>
                ))}
                {proveedoresPaginados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-400">No hay proveedores registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion />
        </>
      )}

      {/* Modal detalle */}
      {modalDetalle && proveedorDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalle del Proveedor</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase">Nombre</p>
                <p className="text-sm font-medium text-gray-800">{proveedorDetalle.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Tipo</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${proveedorDetalle.tipo === 'Empresa' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {proveedorDetalle.tipo}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">NIT / Cédula</p>
                <p className="text-sm text-gray-800">{proveedorDetalle.nit || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Teléfono</p>
                <p className="text-sm text-gray-800">{proveedorDetalle.telefono || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Dirección</p>
                <p className="text-sm text-gray-800">{proveedorDetalle.direccion || '—'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setModalDetalle(false); abrirModalEditar(proveedorDetalle) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Editar</button>
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
              {proveedorEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            {error && <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del proveedor"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposProveedor.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIT / Cédula *</label>
                  <input
                    type="text"
                    value={form.nit}
                    onChange={(e) => setForm({ ...form, nit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 123456789"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/\D/g, '') })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 3001234567"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dirección del proveedor"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={guardando} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : proveedorEditando ? 'Actualizar' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default Proveedores