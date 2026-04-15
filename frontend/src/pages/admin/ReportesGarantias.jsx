import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getServicios, getClientes, getVentas } from '../../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)
const formatCOP = (valor) => `$${Number(valor).toLocaleString('es-CO')}`

const ReportesGarantias = () => {
  const [servicios, setServicios] = useState([])
  const [clientes, setClientes] = useState([])
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [anio, setAnio] = useState(new Date().getFullYear().toString())
  const [mes, setMes] = useState('')
  const [vistaGrafico, setVistaGrafico] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [serviciosRes, clientesRes, ventasRes] = await Promise.all([
        getServicios(), getClientes(), getVentas()
      ])
      setServicios(serviciosRes.data)
      setClientes(clientesRes.data)
      setVentas(ventasRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const garantiasPeriodo = servicios.filter(s => {
    if (s.estado !== 'garantia') return false
    const fecha = new Date(s.createdAt)
    const cumpleAnio = fecha.getFullYear() === parseInt(anio)
    const cumpleMes = mes ? fecha.getMonth() + 1 === parseInt(mes) : true
    return cumpleAnio && cumpleMes
  })

  const datosGarantiasPorMes = MESES.map((m, idx) => {
    const garantiasMes = servicios.filter(s => {
      if (s.estado !== 'garantia') return false
      const fecha = new Date(s.createdAt)
      return fecha.getFullYear() === parseInt(anio) && fecha.getMonth() === idx
    })
    return {
      mes: m,
      Cantidad: garantiasMes.length,
      'Valor Repuestos': garantiasMes.reduce((acc, s) => acc + (s.garantiaValor || 0), 0)
    }
  })

  const datosClientesGarantias = clientes.map(cliente => {
    const garantiasCliente = garantiasPeriodo.filter(s => s.usuarioId === cliente.id)
    return {
      nombre: cliente.nombre,
      empresa: cliente.empresa?.nombre || cliente.nombre,
      etiqueta: `${cliente.nombre} (${cliente.empresa?.nombre || cliente.nombre})`,
      Garantias: garantiasCliente.length,
      'Valor Repuestos': garantiasCliente.reduce((acc, s) => acc + (s.garantiaValor || 0), 0)
    }
  }).filter(c => c.Garantias > 0).sort((a, b) => b.Garantias - a.Garantias)

  // Nuevo reporte: garantías por tipo de producto y producto
const datosProductosGarantias = () => {
  const mapa = {}
  garantiasPeriodo.forEach(g => {
    if (!g.garantiaVentaId) return
    const venta = ventas.find(v => v.id === g.garantiaVentaId)
    if (!venta) return
    venta.items?.forEach(item => {
      const key = `${item.tipoProducto || 'Sin tipo'} — ${item.producto}`
      if (!mapa[key]) {
        mapa[key] = {
          producto: item.producto,
          tipoProducto: item.tipoProducto || 'Sin tipo',
          etiqueta: key,
          Garantias: 0,
          'Valor Repuestos': 0
        }
      }
      mapa[key].Garantias += 1
      mapa[key]['Valor Repuestos'] += g.garantiaValor || 0
    })
  })
  return Object.values(mapa).sort((a, b) => b.Garantias - a.Garantias)
}

  const productosGarantias = datosProductosGarantias()

  const totalGarantias = garantiasPeriodo.length
  const totalRepuestos = garantiasPeriodo.reduce((acc, s) => acc + (s.garantiaValor || 0), 0)
  const conRepuesto = garantiasPeriodo.filter(s => s.garantiaValor > 0).length
  const sinRepuesto = garantiasPeriodo.filter(s => !s.garantiaValor || s.garantiaValor === 0).length

  const periodoTexto = mes ? `${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][parseInt(mes)-1]} ${anio}` : anio

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes de Garantías</h1>
          <p className="text-gray-500">Análisis de garantías de JC System</p>
        </div>
        <div className="flex gap-3">
          <select value={mes} onChange={(e) => setMes(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
          <select value={anio} onChange={(e) => setAnio(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="flex bg-white rounded-lg shadow overflow-hidden">
            <button onClick={() => setVistaGrafico(true)} className={`px-4 py-2 text-sm font-medium transition ${vistaGrafico ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>📊 Gráfico</button>
            <button onClick={() => setVistaGrafico(false)} className={`px-4 py-2 text-sm font-medium transition ${!vistaGrafico ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>📋 Tabla</button>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="text-center text-gray-500 py-10">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Total Garantías — {periodoTexto}</p>
              <p className="text-2xl font-bold text-blue-600">{totalGarantias}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Con Repuesto — {periodoTexto}</p>
              <p className="text-2xl font-bold text-orange-500">{conRepuesto}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Sin Repuesto — {periodoTexto}</p>
              <p className="text-2xl font-bold text-green-600">{sinRepuesto}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Valor Repuestos — {periodoTexto}</p>
              <p className="text-2xl font-bold text-red-500">{formatCOP(totalRepuestos)}</p>
            </div>
          </div>

          {vistaGrafico ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Garantías por Mes — {anio}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosGarantiasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value, name) => name === 'Valor Repuestos' ? formatCOP(value) : value} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Cantidad" fill="#3B82F6" />
                    <Bar yAxisId="right" dataKey="Valor Repuestos" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {datosClientesGarantias.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Clientes con Garantías — {periodoTexto}</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={datosClientesGarantias}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip formatter={(value, name) => name === 'Valor Repuestos' ? formatCOP(value) : value} />
                      <Legend />
                      <Bar dataKey="Garantias" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {productosGarantias.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Garantías por Producto — {periodoTexto}</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productosGarantias}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value, name) => name === 'Valor Repuestos' ? formatCOP(value) : value} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Garantias" fill="#F59E0B" />
                      <Bar yAxisId="right" dataKey="Valor Repuestos" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {garantiasPeriodo.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Detalle de Garantías — {periodoTexto}</h2>
                  <div className="space-y-3">
                    {garantiasPeriodo.map((g) => (
                      <div key={g.id} className="flex justify-between items-center border-b pb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{g.usuario?.nombre}</p>
                          <p className="text-xs text-gray-500">{g.tipo} — {new Date(g.createdAt).toLocaleDateString('es-CO')}</p>
                          {g.informeTecnico && <p className="text-xs text-gray-400">{g.informeTecnico}</p>}
                        </div>
                        <div className="text-right">
                          {g.garantiaValor > 0 ? (
                            <p className="text-sm font-bold text-red-500">{formatCOP(g.garantiaValor)}</p>
                          ) : (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Sin costo</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Garantías por Mes — {anio}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Mes</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Cantidad</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Valor Repuestos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datosGarantiasPorMes.map((fila) => (
                      <tr key={fila.mes} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.mes}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-800">{fila.Cantidad}</td>
                        <td className="px-6 py-3 text-sm text-right text-red-500">{formatCOP(fila['Valor Repuestos'])}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-sm text-gray-800">Total</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-800">{totalGarantias}</td>
                      <td className="px-6 py-3 text-sm text-right text-red-500">{formatCOP(totalRepuestos)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Clientes con Garantías — {periodoTexto}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Empresa / Cliente</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Cliente</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Garantías</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Valor Repuestos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datosClientesGarantias.length > 0 ? datosClientesGarantias.map((fila) => (
                      <tr key={fila.nombre} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.empresa}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{fila.nombre}</td>
                        <td className="px-6 py-3 text-sm text-right text-purple-600">{fila.Garantias}</td>
                        <td className="px-6 py-3 text-sm text-right text-red-500">{formatCOP(fila['Valor Repuestos'])}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="text-center py-10 text-gray-400">No hay garantías en este período</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Garantías por Producto — {periodoTexto}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo Producto</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Producto</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Garantías</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Valor Repuestos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productosGarantias.length > 0 ? productosGarantias.map((fila) => (
                      <tr key={fila.etiqueta} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.tipoProducto}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{fila.producto}</td>
                        <td className="px-6 py-3 text-sm text-right text-yellow-600">{fila.Garantias}</td>
                        <td className="px-6 py-3 text-sm text-right text-red-500">{formatCOP(fila['Valor Repuestos'])}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="text-center py-10 text-gray-400">No hay productos con garantías en este período</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Detalle de Garantías — {periodoTexto}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Cliente</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo Servicio</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Fecha</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Valor Repuesto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {garantiasPeriodo.length > 0 ? garantiasPeriodo.map((g) => (
                      <tr key={g.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{g.usuario?.nombre}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{g.tipo}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{new Date(g.createdAt).toLocaleDateString('es-CO')}</td>
                        <td className="px-6 py-3 text-sm text-right">
                          {g.garantiaValor > 0
                            ? <span className="text-red-500 font-medium">{formatCOP(g.garantiaValor)}</span>
                            : <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded-full">Sin costo</span>
                          }
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="text-center py-10 text-gray-400">No hay garantías en este período</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}

export default ReportesGarantias