import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getClientes, crearCliente, editarCliente, getEmpresas, toggleNotificaciones } from '../../services/api'
import DarkSelect from '../../components/DarkSelect'

const Clientes = () => {
  const [clientes, setClientes] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [clienteDetalle, setClienteDetalle] = useState(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [busqueda, setBusqueda] = useState('')
  const [empresaSubcliente, setEmpresaSubcliente] = useState('')
  const [form, setForm] = useState({
    nombre: '', email: '', telefono: '', nitCedula: '',
    direccion: '', direccionAdicional: '', rol: 'cliente',
    clientePrincipalId: '', empresaId: '', password: ''
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [clientesRes, empresasRes] = await Promise.all([getClientes(), getEmpresas()])
      setClientes(clientesRes.data)
      setEmpresas(empresasRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const abrirModalCrear = () => {
    setClienteEditando(null)
    setEmpresaSubcliente('')
    setForm({
      nombre: '', email: '', telefono: '', nitCedula: '',
      direccion: '', direccionAdicional: '', rol: 'cliente',
      clientePrincipalId: '', empresaId: '', password: ''
    })
    setError('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (cliente) => {
    setClienteEditando(cliente)
    setEmpresaSubcliente(cliente.empresaId || '')
    setForm({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono || '',
      nitCedula: cliente.nitCedula || '',
      direccion: cliente.direccion || '',
      direccionAdicional: cliente.direccionAdicional || '',
      rol: cliente.rol,
      clientePrincipalId: cliente.clientePrincipalId || '',
      empresaId: cliente.empresaId || '',
      password: ''
    })
    setError('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setClienteEditando(null)
    setEmpresaSubcliente('')
    setError('')
  }

  const handleToggleNotificaciones = async (id) => {
    try {
      await toggleNotificaciones(id)
      setClientes(prev => prev.map(c =>
        c.id === id ? { ...c, recibeNotificaciones: !c.recibeNotificaciones } : c
      ))
    } catch (error) {
      console.error('Error actualizando notificaciones:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')

    if (!clienteEditando) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
      if (!passwordRegex.test(form.password)) {
        setError('La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial (!@#$%^&*...)')
        setGuardando(false)
        return
      }
    }

    try {
      if (clienteEditando) {
        await editarCliente(clienteEditando.id, form)
      } else {
        await crearCliente(form)
      }
      await cargarDatos()
      cerrarModal()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar cliente')
    } finally {
      setGuardando(false)
    }
  }

  const clientesPrincipales = clientes.filter(c =>
    c.rol === 'cliente' &&
    (empresaSubcliente ? c.empresaId === parseInt(empresaSubcliente) : true)
  )

  const clientesFiltrados = clientes.filter(c => {
    const termino = busqueda.toLowerCase()
    return busqueda ? (
      c.nombre?.toLowerCase().includes(termino) ||
      c.email?.toLowerCase().includes(termino) ||
      c.nitCedula?.toLowerCase().includes(termino) ||
      c.empresa?.nombre?.toLowerCase().includes(termino)
    ) : true
  })

  const totalPaginas = Math.ceil(clientesFiltrados.length / porPagina)
  const clientesPaginados = clientesFiltrados.slice(
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
          <option value={clientesFiltrados.length}>Todos</option>
        </select>
        <span className="text-sm text-gray-500">registros</span>
      </div>
      <span className="text-sm text-gray-500">
        Mostrando {clientesFiltrados.length === 0 ? 0 : Math.min((paginaActual - 1) * porPagina + 1, clientesFiltrados.length)}–{Math.min(paginaActual * porPagina, clientesFiltrados.length)} de {clientesFiltrados.length} registros
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
          <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-500">Gestión de clientes</p>
        </div>
        <button onClick={abrirModalCrear} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Nuevo Cliente
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1) }}
          placeholder="🔍 Buscar por nombre, email, NIT o empresa..."
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">NIT / Cédula</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Teléfono</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Empresa</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Notificaciones</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientesPaginados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{cliente.nitCedula || '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{cliente.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{cliente.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{cliente.telefono || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cliente.rol === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {cliente.rol === 'cliente' ? 'Principal' : 'Subcliente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{cliente.empresa?.nombre || '—'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleNotificaciones(cliente.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cliente.recibeNotificaciones ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cliente.recibeNotificaciones ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => { setClienteDetalle(cliente); setModalDetalle(true) }} className="text-green-600 hover:text-green-800 text-sm font-medium">Ver</button>
                      <button onClick={() => abrirModalEditar(cliente)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                    </td>
                  </tr>
                ))}
                {clientesPaginados.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-400">No hay clientes registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion />
        </>
      )}

      {/* Modal detalle */}
      {modalDetalle && clienteDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalle del Cliente</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase">Nombre</p>
                <p className="text-sm font-medium text-gray-800">{clienteDetalle.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Email</p>
                <p className="text-sm text-gray-800">{clienteDetalle.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Teléfono</p>
                  <p className="text-sm text-gray-800">{clienteDetalle.telefono || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">NIT / Cédula</p>
                  <p className="text-sm text-gray-800">{clienteDetalle.nitCedula || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Dirección</p>
                <p className="text-sm text-gray-800">{clienteDetalle.direccion || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Dirección Adicional</p>
                <p className="text-sm text-gray-800">{clienteDetalle.direccionAdicional || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Tipo</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${clienteDetalle.rol === 'cliente' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {clienteDetalle.rol === 'cliente' ? 'Principal' : 'Subcliente'}
                </span>
              </div>
              {clienteDetalle.empresa && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Empresa</p>
                  <p className="text-sm text-gray-800">{clienteDetalle.empresa.nombre}</p>
                </div>
              )}
              {clienteDetalle.clientePrincipal && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Cliente Principal</p>
                  <p className="text-sm text-gray-800">{clienteDetalle.clientePrincipal.nombre}</p>
                </div>
              )}
              {clienteDetalle.subClientes && clienteDetalle.subClientes.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-2">Subclientes</p>
                  <div className="space-y-1">
                    {clienteDetalle.subClientes.map(sc => (
                      <p key={sc.id} className="text-sm text-gray-800">• {sc.nombre}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setModalDetalle(false); abrirModalEditar(clienteDetalle) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Editar</button>
              <button onClick={() => setModalDetalle(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            {error && <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="new-password"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIT / Cédula *</label>
                  <input
                    type="text"
                    value={form.nitCedula}
                    onChange={(e) => setForm({ ...form, nitCedula: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={form.rol}
                    onChange={(e) => {
                      setForm({ ...form, rol: e.target.value, clientePrincipalId: '' })
                      setEmpresaSubcliente('')
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="cliente">Principal</option>
                    <option value="subcliente">Subcliente</option>
                  </select>
                </div>
              </div>

              {form.rol === 'subcliente' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa del Subcliente *</label>
                    <DarkSelect
                      options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                      onChange={(opcion) => {
                        setEmpresaSubcliente(opcion?.value || '')
                        setForm({ ...form, clientePrincipalId: '', empresaId: opcion?.value || '' })
                      }}
                      value={empresas.filter(e => e.id === parseInt(empresaSubcliente)).map(e => ({ value: e.id, label: e.nombre }))[0] || null}
                      placeholder="Seleccionar empresa..."
                      noOptionsMessage={() => 'No hay empresas registradas'}
                      isClearable
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente Principal *</label>
                    <DarkSelect
                      options={clientesPrincipales.map(c => ({ value: c.id, label: c.nombre }))}
                      onChange={(opcion) => setForm({ ...form, clientePrincipalId: opcion?.value || '' })}
                      value={clientesPrincipales.filter(c => c.id === form.clientePrincipalId).map(c => ({ value: c.id, label: c.nombre }))[0] || null}
                      placeholder="Seleccionar cliente principal..."
                      noOptionsMessage={() => empresaSubcliente ? 'No hay clientes en esta empresa' : 'Selecciona primero una empresa'}
                      isClearable
                    />
                  </div>
                </>
              )}

              {form.rol === 'cliente' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <DarkSelect
                    options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
                    onChange={(opcion) => setForm({ ...form, empresaId: opcion?.value || '' })}
                    value={empresas.filter(e => e.id === form.empresaId).map(e => ({ value: e.id, label: e.nombre }))[0] || null}
                    placeholder="Seleccionar empresa (opcional)..."
                    noOptionsMessage={() => 'No hay empresas registradas'}
                    isClearable
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Adicional</label>
                <input
                  type="text"
                  value={form.direccionAdicional}
                  onChange={(e) => setForm({ ...form, direccionAdicional: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {!clienteEditando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="new-password"
                    required={!clienteEditando}
                  />
                  <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres, una mayúscula, un número y un carácter especial (!@#$%^&*...)</p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={guardando} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : clienteEditando ? 'Actualizar' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default Clientes