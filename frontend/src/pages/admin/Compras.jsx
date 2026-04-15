import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getCompras, crearCompra, editarCompra, getProveedores, agregarStock } from '../../services/api'
import DarkSelect from '../../components/DarkSelect'

const tiposPago = ['Transferencia', 'Efectivo', 'Nequi', 'Daviplata']
const tiposProducto = ['Equipos de Cómputo', 'Celulares', 'Repuestos']
const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)

const colorEstado = (estado) => {
  const colores = {
    disponible: 'bg-green-100 text-green-700',
    no_disponible: 'bg-gray-100 text-gray-600'
  }
  return colores[estado] || 'bg-gray-100 text-gray-700'
}

const colorTipoUso = (tipoUso) => {
  const colores = {
    venta: 'bg-blue-100 text-blue-700',
    garantia: 'bg-orange-100 text-orange-700'
  }
  return colores[tipoUso] || ''
}

const Compras = () => {
  const [compras, setCompras] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [filtroEstado, setFiltroEstado] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [modalStock, setModalStock] = useState(false)
  const [compraEditando, setCompraEditando] = useState(null)
  const [compraDetalle, setCompraDetalle] = useState(null)
  const [compraStock, setCompraStock] = useState(null)
  const [form, setForm] = useState({
    producto: '', proveedorId: '', valorUnitario: '', cantidad: 1,
    tipoPago: '', descripcion: '', tipoProducto: '', condicion: ''
  })
  const [formStock, setFormStock] = useState({ cantidadAgregar: '', valorUnitario: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardandoStock, setGuardandoStock] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [comprasRes, proveedoresRes] = await Promise.all([getCompras(), getProveedores()])
      setCompras(comprasRes.data)
      setProveedores(proveedoresRes.data)
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

  const abrirModalCrear = () => {
    setCompraEditando(null)
    setForm({
      producto: '', proveedorId: '', valorUnitario: '', cantidad: 1,
      tipoPago: '', descripcion: '', tipoProducto: '', condicion: ''
    })
    setError('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (compra) => {
    setCompraEditando(compra)
    setForm({
      producto: compra.producto,
      proveedorId: compra.proveedorId || '',
      valorUnitario: compra.valorUnitario,
      cantidad: compra.cantidad,
      tipoPago: compra.tipoPago,
      descripcion: compra.descripcion || '',
      tipoProducto: compra.tipoProducto || '',
      condicion: compra.condicion || '',
      estado: compra.estado
    })
    setError('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setCompraEditando(null)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')

    if (!form.proveedorId) {
      setError('Debes seleccionar un proveedor')
      setGuardando(false)
      return
    }

    try {
      if (compraEditando) {
        await editarCompra(compraEditando.id, form)
      } else {
        await crearCompra(form)
      }
      await cargarDatos()
      cerrarModal()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar compra')
    } finally {
      setGuardando(false)
    }
  }

  const handleAgregarStock = async (e) => {
    e.preventDefault()
    setGuardandoStock(true)
    setError('')
    try {
      await agregarStock(compraStock.id, formStock)
      await cargarDatos()
      setModalStock(false)
      setCompraStock(null)
      setFormStock({ cantidadAgregar: '', valorUnitario: '' })
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al agregar stock')
    } finally {
      setGuardandoStock(false)
    }
  }

  const comprasFiltradas = compras.filter(c => {
    const fecha = new Date(c.createdAt)
    const cumpleMes = filtroMes ? fecha.getMonth() + 1 === parseInt(filtroMes) : true
    const cumpleAnio = filtroAnio ? fecha.getFullYear() === parseInt(filtroAnio) : true
    const cumpleEstado = filtroEstado ? c.estado === filtroEstado : true
    const termino = busqueda.toLowerCase()
    const cumpleBusqueda = busqueda ? (
      c.producto?.toLowerCase().includes(termino) ||
      c.tipoProducto?.toLowerCase().includes(termino) ||
      c.condicion?.toLowerCase().includes(termino) ||
      c.proveedor_r?.nombre?.toLowerCase().includes(termino)
    ) : true
    return cumpleMes && cumpleAnio && cumpleEstado && cumpleBusqueda
  })

  const totalCompras = comprasFiltradas.reduce((acc, c) => acc + (c.valorTotal || 0), 0)
  const valorTotalModal = (parseFloat(form.valorUnitario) || 0) * (parseInt(form.cantidad) || 0)

  const totalPaginas = Math.ceil(comprasFiltradas.length / porPagina)
  const comprasPaginadas = comprasFiltradas.slice(
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
          <option value={comprasFiltradas.length}>Todos</option>
        </select>
        <span className="text-sm text-gray-500">registros</span>
      </div>
      <span className="text-sm text-gray-500">
        Mostrando {comprasFiltradas.length === 0 ? 0 : Math.min((paginaActual - 1) * porPagina + 1, comprasFiltradas.length)}–{Math.min(paginaActual * porPagina, comprasFiltradas.length)} de {comprasFiltradas.length} registros
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} disabled={paginaActual === 1} className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Anterior</button>
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
            <button key={p} onClick={() => setPaginaActual(p)} className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${paginaActual === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}>{p}</button>
          ))}
        <button onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))} disabled={paginaActual === totalPaginas || totalPaginas === 0} className="px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Siguiente →</button>
      </div>
    </div>
  )

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Compras</h1>
          <p className="text-gray-500">Registro de compras de equipos y repuestos</p>
        </div>
        <button onClick={abrirModalCrear} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Nueva Compra
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-2">
          <button onClick={() => cambiarFiltro(setFiltroEstado, '')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Todos</button>
          <button onClick={() => cambiarFiltro(setFiltroEstado, 'disponible')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'disponible' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Disponible</button>
          <button onClick={() => cambiarFiltro(setFiltroEstado, 'no_disponible')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'no_disponible' ? 'bg-gray-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>No Disponible</button>
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
          <p className="text-sm text-gray-500">Cantidad de Compras</p>
          <p className="text-xl font-bold text-blue-600">{comprasFiltradas.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Total Compras</p>
          <p className="text-xl font-bold text-red-500">${totalCompras.toLocaleString('es-CO')}</p>
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500"># Compra</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Producto</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Condición</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Proveedor</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Cant. Disp.</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Valor Unit.</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Vendidas / Garantías</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comprasPaginadas.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">#{compra.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{compra.producto}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compra.tipoProducto || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compra.condicion || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{compra.proveedor_r?.nombre || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="font-medium">{compra.cantidadDisponible}</span>
                      <span className="text-gray-400"> / {compra.cantidad}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">${(compra.valorUnitario || 0).toLocaleString('es-CO')}</td>
                   <td className="px-6 py-4 text-sm text-gray-600">
                    {(compra.unidadesVendidas > 0 || compra.unidadesGarantia > 0) ? (
                      <div className="flex flex-col gap-1 items-start">
                        {compra.unidadesVendidas > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Vendidas: {compra.unidadesVendidas}
                          </span>
                        )}
                        {compra.unidadesGarantia > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            Garantías: {compra.unidadesGarantia}
                          </span>
                        )}
                      </div>
                    ) : '—'}
                  </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(compra.estado)}`}>
                        {compra.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => { setCompraDetalle(compra); setModalDetalle(true) }} className="text-green-600 hover:text-green-800 text-sm font-medium">Ver</button>
                      <button onClick={() => abrirModalEditar(compra)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                      <button
                        onClick={() => {
                          setCompraStock(compra)
                          setFormStock({ cantidadAgregar: '', valorUnitario: compra.valorUnitario })
                          setError('')
                          setModalStock(true)
                        }}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        + Stock
                      </button>
                    </td>
                  </tr>
                ))}
                {comprasPaginadas.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center py-10 text-gray-400">No hay compras registradas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion />
        </>
      )}

      {/* Modal detalle */}
      {modalDetalle && compraDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalle de la Compra #{compraDetalle.id}</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase">Producto</p>
                <p className="text-sm font-medium text-gray-800">{compraDetalle.producto}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Tipo de Producto</p>
                  <p className="text-sm text-gray-800">{compraDetalle.tipoProducto || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Condición</p>
                  <p className="text-sm text-gray-800">{compraDetalle.condicion || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Proveedor</p>
                <p className="text-sm text-gray-800">{compraDetalle.proveedor_r?.nombre || '—'}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Cantidad</p>
                  <p className="text-sm text-gray-800">{compraDetalle.cantidad}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Disponible</p>
                  <p className="text-sm font-bold text-green-600">{compraDetalle.cantidadDisponible}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Valor Unit.</p>
                  <p className="text-sm text-gray-800">${(compraDetalle.valorUnitario || 0).toLocaleString('es-CO')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Valor Total</p>
                  <p className="text-sm font-bold text-gray-800">${(compraDetalle.valorTotal || 0).toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Tipo de Pago</p>
                  <p className="text-sm text-gray-800">{compraDetalle.tipoPago}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Estado</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(compraDetalle.estado)}`}>
                    {compraDetalle.estado}
                  </span>
                </div>
                {compraDetalle.tipoUso && (
               <div>
                  <p className="text-xs text-gray-400 uppercase">Vendidas / Garantías</p>
                  <div className="flex gap-2 mt-1">
                    {compraDetalle.unidadesVendidas > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Vendidas: {compraDetalle.unidadesVendidas}
                      </span>
                    )}
                    {compraDetalle.unidadesGarantia > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        Garantías: {compraDetalle.unidadesGarantia}
                      </span>
                    )}
                    {!compraDetalle.unidadesVendidas && !compraDetalle.unidadesGarantia && (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Descripción</p>
                <p className="text-sm text-gray-800">{compraDetalle.descripcion || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Fecha</p>
                <p className="text-sm text-gray-800">{new Date(compraDetalle.createdAt).toLocaleDateString('es-CO')}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setModalDetalle(false); abrirModalEditar(compraDetalle) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Editar</button>
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
              {compraEditando ? 'Editar Compra' : 'Nueva Compra'}
            </h2>
            {error && <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Producto *</label>
                <select
                  value={form.tipoProducto}
                  onChange={(e) => setForm({ ...form, tipoProducto: e.target.value, condicion: '' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposProducto.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {(form.tipoProducto === 'Equipos de Cómputo' || form.tipoProducto === 'Celulares') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condición *</label>
                  <select
                    value={form.condicion}
                    onChange={(e) => setForm({ ...form, condicion: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar condición</option>
                    <option value="Nuevo">Nuevo</option>
                    <option value="Usado">Usado</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                <input
                  type="text"
                  value={form.producto}
                  onChange={(e) => setForm({ ...form, producto: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Portatil HP 240 G10"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                <DarkSelect
                  options={proveedores.map((p) => ({ value: p.id, label: p.nombre }))}
                  onChange={(opcion) => setForm({ ...form, proveedorId: opcion?.value || '' })}
                  value={proveedores.filter(p => p.id === form.proveedorId).map(p => ({ value: p.id, label: p.nombre }))[0] || null}
                  placeholder="Buscar proveedor..."
                  noOptionsMessage={() => 'No hay proveedores registrados'}
                  isClearable
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.cantidad}
                    onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Unitario *</label>
                  <input
                    type="number"
                    value={form.valorUnitario}
                    onChange={(e) => setForm({ ...form, valorUnitario: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago *</label>
                  <select
                    value={form.tipoPago}
                    onChange={(e) => setForm({ ...form, tipoPago: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {tiposPago.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(form.valorUnitario && form.cantidad) && (
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Valor Total: <span className="font-bold text-blue-600 dark:text-blue-400">${valorTotalModal.toLocaleString('es-CO')}</span>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción adicional..."
                />
              </div>
              {compraEditando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="no_disponible">No Disponible</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={guardando} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : compraEditando ? 'Actualizar' : 'Registrar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal agregar stock */}
      {modalStock && compraStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Agregar Stock</h2>
              <button onClick={() => setModalStock(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-800">{compraStock.producto}</p>
              <p className="text-xs text-gray-500">Cantidad actual: {compraStock.cantidad} — Disponible: {compraStock.cantidadDisponible}</p>
              <p className="text-xs text-gray-500">Valor unitario actual: ${compraStock.valorUnitario.toLocaleString('es-CO')}</p>
            </div>
            {error && <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleAgregarStock} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a agregar *</label>
                <input
                  type="number"
                  min="1"
                  value={formStock.cantidadAgregar}
                  onChange={(e) => setFormStock({ ...formStock, cantidadAgregar: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor unitario</label>
                <input
                  type="number"
                  value={formStock.valorUnitario}
                  onChange={(e) => setFormStock({ ...formStock, valorUnitario: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dejar vacío para mantener el mismo"
                />
                <p className="text-xs text-gray-400 mt-1">Si el precio cambió actualízalo aquí</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalStock(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={guardandoStock} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition disabled:opacity-50">
                  {guardandoStock ? 'Agregando...' : 'Agregar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default Compras