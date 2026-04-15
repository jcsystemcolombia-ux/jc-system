import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getVentas, crearVenta, editarVenta, getClientes, getComprasDisponibles } from '../../services/api'
import DarkSelect from '../../components/DarkSelect'
import InputMoneda from '../../components/InputMoneda'

const tiposPago = ['Transferencia', 'Efectivo', 'Nequi', 'Daviplata']
const tiposProducto = ['Equipos de Cómputo', 'Celulares', 'Repuestos']
const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)

const itemVacio = {
  producto: '', proveedor: '', valorCompra: '',
  valorVenta: '', tipoProducto: '', condicion: '', compraId: '', cantidad: 1
}

const Ventas = () => {
  const [ventas, setVentas] = useState([])
  const [clientes, setClientes] = useState([])
  const [comprasDisponibles, setComprasDisponibles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(5)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [ventaEditando, setVentaEditando] = useState(null)
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const [items, setItems] = useState([{ ...itemVacio }])
  const [form, setForm] = useState({
    tipoPago: '', pagoInversion: '', usuarioId: ''
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [ventasRes, clientesRes, comprasRes] = await Promise.all([
        getVentas(), getClientes(), getComprasDisponibles()
      ])
      setVentas(ventasRes.data)
      setClientes(clientesRes.data)
      setComprasDisponibles(comprasRes.data)
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
    setVentaEditando(null)
    setItems([{ ...itemVacio }])
    setForm({ tipoPago: '', pagoInversion: '', usuarioId: '' })
    setError('')
    setModalAbierto(true)
  }

  const abrirModalEditar = (venta) => {
    setVentaEditando(venta)
    setItems(venta.items.map(item => ({
      producto: item.producto,
      proveedor: item.proveedor || '',
      valorCompra: item.valorCompra || '',
      valorVenta: item.valorVenta,
      tipoProducto: item.tipoProducto || '',
      condicion: item.condicion || '',
      compraId: item.compraId || '',
      cantidad: item.cantidad || 1
    })))
    setForm({
      tipoPago: venta.tipoPago,
      pagoInversion: venta.pagoInversion || '',
      usuarioId: venta.usuarioId
    })
    setError('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setVentaEditando(null)
    setError('')
  }

  const handleCompraSeleccionada = (opcion, index) => {
    const nuevosItems = [...items]
    if (opcion) {
      const compra = comprasDisponibles.find(c => c.id === opcion.value)
      nuevosItems[index] = {
        ...nuevosItems[index],
        compraId: compra.id,
        producto: compra.producto,
        proveedor: compra.proveedor_r?.nombre || '',
        valorCompra: compra.valorUnitario,
        tipoProducto: compra.tipoProducto || '',
        condicion: compra.condicion || '',
        cantidad: 1,
        cantidadDisponible: compra.cantidadDisponible
      }
    } else {
      nuevosItems[index] = { ...itemVacio }
    }
    setItems(nuevosItems)
  }

  const comprasDisponiblesFiltradas = (indexActual) => {
    const compraIdsSeleccionadas = items
      .filter((_, i) => i !== indexActual)
      .map(item => parseInt(item.compraId))
      .filter(id => !isNaN(id))
    return comprasDisponibles.filter(c => !compraIdsSeleccionadas.includes(c.id))
  }

  const agregarItem = () => {
    setItems([...items, { ...itemVacio }])
  }

  const eliminarItem = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')

    if (!form.usuarioId && !ventaEditando) {
      setError('Debes seleccionar un cliente')
      setGuardando(false)
      return
    }

    const itemsInvalidos = items.some(item => !item.producto || !item.valorVenta || parseFloat(item.valorVenta) <= 0)
    if (itemsInvalidos) {
      setError('Todos los productos deben tener nombre y valor de venta')
      setGuardando(false)
      return
    }

    try {
      if (ventaEditando) {
        await editarVenta(ventaEditando.id, { ...form, items })
      } else {
        await crearVenta({ ...form, items })
      }
      await cargarDatos()
      cerrarModal()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar venta')
    } finally {
      setGuardando(false)
    }
  }

  const totalVentaModal = items.reduce((acc, item) =>
    acc + ((parseFloat(item.valorVenta) || 0) * (parseInt(item.cantidad) || 1)), 0)
  const totalCompraModal = items.reduce((acc, item) =>
    acc + ((parseFloat(item.valorCompra) || 0) * (parseInt(item.cantidad) || 1)), 0)
  const gananciaModal = totalVentaModal - totalCompraModal - (parseFloat(form.pagoInversion) || 0)

  const ventasFiltradas = ventas.filter(v => {
    const fecha = new Date(v.createdAt)
    const cumpleTipo = filtroTipo ? v.items?.some(i => i.tipoProducto === filtroTipo) : true
    const cumpleMes = filtroMes ? fecha.getMonth() + 1 === parseInt(filtroMes) : true
    const cumpleAnio = filtroAnio ? fecha.getFullYear() === parseInt(filtroAnio) : true
    const termino = busqueda.toLowerCase()
    const cumpleBusqueda = busqueda ? (
      v.usuario?.nombre?.toLowerCase().includes(termino) ||
      v.usuario?.empresa?.nombre?.toLowerCase().includes(termino) ||
      v.items?.some(i => i.producto?.toLowerCase().includes(termino)) ||
      v.items?.some(i => i.tipoProducto?.toLowerCase().includes(termino)) ||
      v.items?.some(i => i.condicion?.toLowerCase().includes(termino))
    ) : true
    return cumpleTipo && cumpleMes && cumpleAnio && cumpleBusqueda
  })

  const totalVentas = ventasFiltradas.reduce((acc, v) =>
    acc + (v.items?.reduce((s, i) => s + (i.valorVenta * (i.cantidad || 1)), 0) || 0), 0)
 const totalGanancia = ventasFiltradas.reduce((acc, v) =>
  acc + ((v.items?.reduce((s, i) => s + i.ganancia, 0) || 0) - (v.pagoInversion || 0)), 0)

  const totalPaginas = Math.ceil(ventasFiltradas.length / porPagina)
  const ventasPaginadas = ventasFiltradas.slice(
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
          <option value={ventasFiltradas.length}>Todos</option>
        </select>
        <span className="text-sm text-gray-500">registros</span>
      </div>
      <span className="text-sm text-gray-500">
        Mostrando {ventasFiltradas.length === 0 ? 0 : Math.min((paginaActual - 1) * porPagina + 1, ventasFiltradas.length)}–{Math.min(paginaActual * porPagina, ventasFiltradas.length)} de {ventasFiltradas.length} registros
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
          <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
          <p className="text-gray-500">Registro de ventas de equipos y repuestos</p>
        </div>
        <button onClick={abrirModalCrear} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Nueva Venta
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => cambiarFiltro(setFiltroTipo, '')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroTipo === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Todos</button>
          {tiposProducto.map((tipo) => (
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

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Cantidad de Ventas</p>
          <p className="text-xl font-bold text-blue-600">{ventasFiltradas.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Total Ventas</p>
          <p className="text-xl font-bold text-green-600">${totalVentas.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">Pago Inversión</p>
          <p className="text-xl font-bold text-purple-600">${ventasFiltradas.reduce((acc, v) => acc + (v.pagoInversion || 0), 0).toLocaleString('es-CO')}</p>
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
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500"># Venta</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Empresa / Cliente</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Productos</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Total Venta</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Ganancia</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Cobro</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventasPaginadas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">#{venta.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <p className="font-medium">{venta.usuario?.empresa?.nombre || venta.usuario?.nombre}</p>
                      <p className="text-xs text-gray-500">{venta.usuario?.nombre}</p>
                    </td>
            <td className="px-6 py-4 text-sm text-gray-600">
  {venta.items?.map((item, idx) => (
    <p key={idx}>{item.producto} {item.cantidad > 1 ? `(x${item.cantidad})` : ''}</p>
  ))}
  <p className="text-xs text-gray-400">{venta.tipoPago}</p>
</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      ${(venta.items?.reduce((s, i) => s + (i.valorVenta * (i.cantidad || 1)), 0) || 0).toLocaleString('es-CO')}
                    </td>
                   <td className="px-6 py-4 text-sm text-green-600 font-medium">
                      ${((venta.items?.reduce((s, i) => s + i.ganancia, 0) || 0) - (venta.pagoInversion || 0)).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      {venta.cuentaCobro && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${venta.cuentaCobro.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {venta.cuentaCobro.estado}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => { setVentaDetalle(venta); setModalDetalle(true) }} className="text-green-600 hover:text-green-800 text-sm font-medium">Ver</button>
                      <button onClick={() => abrirModalEditar(venta)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                    </td>
                  </tr>
                ))}
                {ventasPaginadas.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">No hay ventas registradas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Paginacion />
        </>
      )}

      {/* Modal detalle */}
      {modalDetalle && ventaDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalle de la Venta #{ventaDetalle.id}</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase">Cliente</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">{ventaDetalle.usuario?.nombre}</p>
                  {ventaDetalle.usuario?.empresa && (
                    <span className="text-xs text-gray-500">— Empresa: <strong className="text-gray-700">{ventaDetalle.usuario.empresa.nombre}</strong></span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Tipo de Pago</p>
                <p className="text-sm text-gray-800">{ventaDetalle.tipoPago}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase mb-2">Productos</p>
                <div className="space-y-2">
                  {ventaDetalle.items?.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-800">
                        {item.producto} {item.cantidad > 1 ? `(x${item.cantidad})` : ''}
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <p className="text-xs text-gray-500">Tipo: {item.tipoProducto || '—'}</p>
                        <p className="text-xs text-gray-500">Condición: {item.condicion || '—'}</p>
                        <p className="text-xs text-gray-500">Compra unit.: ${item.valorCompra.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-gray-500">Venta unit.: ${item.valorVenta.toLocaleString('es-CO')}</p>
                        {item.cantidad > 1 && (
                          <p className="text-xs text-gray-500">Total venta: ${(item.valorVenta * item.cantidad).toLocaleString('es-CO')}</p>
                        )}
                        <p className="text-xs text-green-600 font-medium">Ganancia: ${item.ganancia.toLocaleString('es-CO')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Total Venta</p>
                  <p className="text-lg font-bold text-gray-800">
                    ${(ventaDetalle.items?.reduce((s, i) => s + (i.valorVenta * (i.cantidad || 1)), 0) || 0).toLocaleString('es-CO')}
                  </p>
                  </div>
                    <div>
                  <p className="text-xs text-gray-400 uppercase">Pago Inversión</p>
                  <p className="text-lg font-bold text-purple-600">
                  ${(ventaDetalle.pagoInversion || 0).toLocaleString('es-CO')}
                  </p>
                  </div>
                  <div>
                <p className="text-xs text-gray-400 uppercase">Ganancia Neta</p>
                <p className="text-lg font-bold text-green-600">
                  ${((ventaDetalle.items?.reduce((s, i) => s + i.ganancia, 0) || 0) - (ventaDetalle.pagoInversion || 0)).toLocaleString('es-CO')}
                </p>
              </div>
              </div>
              {ventaDetalle.cuentaCobro && (
                <div>
                  <p className="text-xs text-gray-400 uppercase">Cuenta de Cobro</p>
                  <p className="text-sm text-gray-800">#{ventaDetalle.cuentaCobro.numeroCuenta} — {ventaDetalle.cuentaCobro.estado}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setModalDetalle(false); abrirModalEditar(ventaDetalle) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Editar</button>
              <button onClick={() => setModalDetalle(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {ventaEditando ? 'Editar Venta' : 'Nueva Venta'}
            </h2>
            {error && <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!ventaEditando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                  <DarkSelect
                    options={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
                    onChange={(opcion) => setForm({ ...form, usuarioId: opcion?.value || '' })}
                    placeholder="Buscar cliente..."
                    noOptionsMessage={() => 'No se encontró el cliente'}
                    isClearable
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Productos *</label>
                  <button type="button" onClick={agregarItem} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    + Agregar producto
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 relative">
                      {items.length > 1 && (
                        <button type="button" onClick={() => eliminarItem(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-sm">✕</button>
                      )}
                      <p className="text-xs font-medium text-gray-500 mb-3">Producto {index + 1}</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Del inventario</label>
                          <DarkSelect
                            options={comprasDisponiblesFiltradas(index).map((c) => ({
                              value: c.id,
                              label: `${c.producto} — ${c.condicion || c.tipoProducto || ''} — $${c.valorUnitario.toLocaleString('es-CO')} — Disp: ${c.cantidadDisponible}`
                            }))}
                            onChange={(opcion) => handleCompraSeleccionada(opcion, index)}
                            placeholder="Seleccionar del inventario..."
                            noOptionsMessage={() => 'No hay productos disponibles'}
                            isClearable
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Producto</label>
                            <input type="text" value={item.tipoProducto} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Condición</label>
                            <input type="text" value={item.condicion} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Producto</label>
                          <input type="text" value={item.producto} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
<div>
  <label className="block text-xs font-medium text-gray-600 mb-1">Valor Compra</label>
  <input
    type="text"
    value={item.valorCompra ? '$' + parseFloat(item.valorCompra).toLocaleString('es-CO') : ''}
    readOnly
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
  />
</div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Valor Venta *</label>
                            <InputMoneda
                              value={item.valorVenta}
                              onChange={(val) => {
                                const nuevosItems = [...items]
                                nuevosItems[index].valorVenta = val
                                setItems(nuevosItems)
                              }}
                              placeholder="$0"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Cantidad * {item.cantidadDisponible ? `(Máx: ${item.cantidadDisponible})` : ''}
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={item.cantidadDisponible || undefined}
                              value={item.cantidad}
                              onChange={(e) => {
                                const nuevosItems = [...items]
                                const cant = parseInt(e.target.value) || 1
                                if (item.cantidadDisponible && cant > item.cantidadDisponible) return
                                nuevosItems[index].cantidad = cant
                                setItems(nuevosItems)
                              }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                    {item.valorVenta && (
                            <div className="bg-green-50 dark:bg-green-900 rounded-lg px-3 py-2">
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                Ganancia: <span className="font-bold text-green-600 dark:text-green-400">
                                  ${((parseFloat(item.valorVenta) - (parseFloat(item.valorCompra) || 0)) * (parseInt(item.cantidad) || 1)).toLocaleString('es-CO')}
                                </span>
                                {item.cantidad > 1 && <span className="text-gray-400 ml-1">(x{item.cantidad})</span>}
                              </p>
                              {item.cantidad > 1 && (
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                  Total producto: <span className="font-bold text-blue-600 dark:text-blue-400">
                                    ${(parseFloat(item.valorVenta) * (parseInt(item.cantidad) || 1)).toLocaleString('es-CO')}
                                  </span>
                                </p>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pago Inversión</label>
                  <InputMoneda
                    value={form.pagoInversion}
                    onChange={(val) => setForm({ ...form, pagoInversion: val })}
                    placeholder="$0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {totalVentaModal > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg px-4 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Total Venta:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">${totalVentaModal.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-300">Ganancia Inversionista:</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">${(parseFloat(form.pagoInversion) || 0).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-300">Ganancia Total:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">${gananciaModal.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={guardando} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {guardando ? 'Guardando...' : ventaEditando ? 'Actualizar' : 'Registrar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default Ventas