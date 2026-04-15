import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getServicios, getClientes } from '../../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

const formatCOP = (valor) => `$${Number(valor).toLocaleString('es-CO')}`

const ReportesOperativos = () => {
  const [servicios, setServicios] = useState([])
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [anio, setAnio] = useState(new Date().getFullYear().toString())
  const [mes, setMes] = useState('')
  const [vistaGrafico, setVistaGrafico] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [serviciosRes, clientesRes] = await Promise.all([getServicios(), getClientes()])
      setServicios(serviciosRes.data)
      setClientes(clientesRes.data)
      console.log('clientes:', clientesRes.data[0])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const filtrarPorPeriodo = (items) => {
    return items.filter(i => {
      const fecha = new Date(i.createdAt)
      const cumpleAnio = fecha.getFullYear() === parseInt(anio)
      const cumpleMes = mes ? fecha.getMonth() + 1 === parseInt(mes) : true
      return cumpleAnio && cumpleMes
    })
  }

  const serviciosPeriodo = filtrarPorPeriodo(servicios)

  const datosEstado = ['pendiente', 'completado', 'garantia', 'cancelado'].map(estado => ({
    estado: estado.charAt(0).toUpperCase() + estado.slice(1),
    Cantidad: serviciosPeriodo.filter(s => s.estado === estado).length
  }))

  const tiposServicio = [...new Set(servicios.map(s => s.tipo))]
  const datosTipo = tiposServicio.map(tipo => ({
    tipo,
    Cantidad: serviciosPeriodo.filter(s => s.tipo === tipo).length,
    'Total Ingresos': serviciosPeriodo.filter(s => s.tipo === tipo && s.estado === 'completado').reduce((acc, s) => acc + s.valor, 0)
  })).sort((a, b) => b.Cantidad - a.Cantidad)

  const datosClientes = clientes.map(cliente => {
    const serviciosCliente = serviciosPeriodo.filter(s => s.usuarioId === cliente.id)
    const empresa = cliente.empresa?.nombre || cliente.nombre
    return {
      nombre: cliente.nombre,
      empresa,
      etiqueta: `${cliente.nombre} (${empresa})`,
      Servicios: serviciosCliente.length,
      Completados: serviciosCliente.filter(s => s.estado === 'completado').length,
      Total: serviciosCliente.filter(s => s.estado === 'completado').reduce((acc, s) => acc + s.valor, 0)
    }
  }).filter(c => c.Servicios > 0).sort((a, b) => b.Servicios - a.Servicios).slice(0, 10)

  const periodoTexto = mes ? `${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][parseInt(mes)-1]} ${anio}` : anio

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes Operativos</h1>
          <p className="text-gray-500">Análisis operativo de JC System</p>
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
              <p className="text-sm text-gray-500">Total Servicios — {periodoTexto}</p>
              <p className="text-2xl font-bold text-blue-600">{serviciosPeriodo.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Completados — {periodoTexto}</p>
              <p className="text-2xl font-bold text-green-600">{serviciosPeriodo.filter(s => s.estado === 'completado').length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Pendientes — {periodoTexto}</p>
              <p className="text-2xl font-bold text-yellow-600">{serviciosPeriodo.filter(s => s.estado === 'pendiente').length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Garantías — {periodoTexto}</p>
              <p className="text-2xl font-bold text-purple-600">{serviciosPeriodo.filter(s => s.estado === 'garantia').length}</p>
            </div>
          </div>

          {vistaGrafico ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Servicios por Estado — {periodoTexto}</h2>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={250}>
                    <PieChart>
                      <Pie data={datosEstado} cx="50%" cy="50%" outerRadius={100} dataKey="Cantidad" label={({ estado, Cantidad }) => `${estado}: ${Cantidad}`}>
                        {datosEstado.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {datosEstado.map((item, index) => (
                      <div key={item.estado} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: COLORS[index] }}></span>
                        <span className="text-sm text-gray-700">{item.estado}: <strong>{item.Cantidad}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Servicios por Tipo — {periodoTexto}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosTipo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={(value, name) => name === 'Total Ingresos' ? formatCOP(value) : value} />
                    <Legend />
                    <Bar dataKey="Cantidad" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Top Clientes por Servicios — {periodoTexto}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosClientes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip formatter={(value, name) => name === 'Total' ? formatCOP(value) : value} />
                    <Legend />
                    <Bar dataKey="Servicios" fill="#3B82F6" />
                    <Bar dataKey="Completados" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Servicios por Estado — {periodoTexto}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datosEstado.map((fila) => (
                      <tr key={fila.estado} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.estado}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-800">{fila.Cantidad}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-sm text-gray-800">Total</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-800">{serviciosPeriodo.length}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Servicios por Tipo — {periodoTexto}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Cantidad</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datosTipo.map((fila) => (
                      <tr key={fila.tipo} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.tipo}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-800">{fila.Cantidad}</td>
                        <td className="px-6 py-3 text-sm text-right text-blue-600">{formatCOP(fila['Total Ingresos'])}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-sm text-gray-800">Total</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-800">{datosTipo.reduce((acc, d) => acc + d.Cantidad, 0)}</td>
                      <td className="px-6 py-3 text-sm text-right text-blue-600">{formatCOP(datosTipo.reduce((acc, d) => acc + d['Total Ingresos'], 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Top Clientes por Servicios — {periodoTexto}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Cliente</th>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Empresa</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total Servicios</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Completados</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datosClientes.map((fila) => (
                      <tr key={fila.nombre} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.nombre}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{fila.empresa}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-800">{fila.Servicios}</td>
                        <td className="px-6 py-3 text-sm text-right text-green-600">{fila.Completados}</td>
                        <td className="px-6 py-3 text-sm text-right text-blue-600">{formatCOP(fila.Total)}</td>
                      </tr>
                    ))}
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

export default ReportesOperativos