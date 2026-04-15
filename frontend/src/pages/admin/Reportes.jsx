import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getServicios, getVentas, getGastos, getCuentasCobro, getCompras } from '../../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'



const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_COMPLETOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)

const formatCOP = (valor) => `$${Number(valor).toLocaleString('es-CO')}`

const categoriasVenta = [
  { key: 'Equipos de Cómputo Nuevo', tipoProducto: 'Equipos de Cómputo', condicion: 'Nuevo' },
  { key: 'Equipos de Cómputo Usado', tipoProducto: 'Equipos de Cómputo', condicion: 'Usado' },
  { key: 'Celulares Nuevo', tipoProducto: 'Celulares', condicion: 'Nuevo' },
  { key: 'Celulares Usado', tipoProducto: 'Celulares', condicion: 'Usado' },
  { key: 'Repuestos', tipoProducto: 'Repuestos', condicion: null }
]

// Helper para obtener total de valorVenta de una venta
const getVentaTotal = (venta) => venta.items?.reduce((acc, i) => acc + (i.valorVenta * (i.cantidad || 1)), 0) || 0
const getVentaGanancia = (venta) => (venta.items?.reduce((acc, i) => acc + i.ganancia, 0) || 0) - (venta.pagoInversion || 0)

const Reportes = () => {
  const [compras, setCompras] = useState([])
  const [servicios, setServicios] = useState([])
  const [ventas, setVentas] = useState([])
  const [gastos, setGastos] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [anio, setAnio] = useState(new Date().getFullYear().toString())
  const [mes, setMes] = useState('')
  const [vistaGrafico, setVistaGrafico] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [serviciosRes, ventasRes, gastosRes, cuentasRes, comprasRes] = await Promise.all([
        getServicios(),
        getVentas(),
        getGastos(),
        getCuentasCobro(),
        getCompras()
      ])
      setServicios(serviciosRes.data)
      setVentas(ventasRes.data)
      setGastos(gastosRes.data)
      setCuentas(cuentasRes.data)
      setCompras(comprasRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const filtrarPorPeriodo = (items, campo) => {
    return items.filter(i => {
      const fecha = new Date(i[campo])
      const cumpleAnio = fecha.getFullYear() === parseInt(anio)
      const cumpleMes = mes ? fecha.getMonth() + 1 === parseInt(mes) : true
      return cumpleAnio && cumpleMes
    })
  }

  const filtrarPorAnio = (items, campo) => {
    return items.filter(i => new Date(i[campo]).getFullYear() === parseInt(anio))
  }

  const serviciosPeriodo = filtrarPorPeriodo(servicios, 'createdAt').filter(s => s.estado === 'completado')
  const ventasPeriodo = filtrarPorPeriodo(ventas, 'createdAt')
  const gastosPeriodo = filtrarPorPeriodo(gastos, 'fecha')

  const totalIngresosPorServicios = serviciosPeriodo.reduce((acc, s) => acc + s.valor, 0)
  const totalIngresosPorVentas = ventasPeriodo.reduce((acc, v) => acc + getVentaTotal(v), 0)
  const totalGananciaPeriodo = serviciosPeriodo.reduce((acc, s) => acc + (s.valor - s.pagoInversion), 0) +
    ventasPeriodo.reduce((acc, v) => acc + getVentaGanancia(v), 0)
  const totalGananciInversionista = serviciosPeriodo.reduce((acc, s) => acc + s.pagoInversion, 0) +
    ventasPeriodo.reduce((acc, v) => acc + (v.pagoInversion || 0), 0)
  const totalGastosPeriodo = gastosPeriodo.reduce((acc, g) => acc + g.valor, 0)

  const datosIngresosPorMes = MESES.map((m, idx) => {
    const serviciosMes = filtrarPorAnio(servicios, 'createdAt')
      .filter(s => new Date(s.createdAt).getMonth() === idx && s.estado === 'completado')
      .reduce((acc, s) => acc + s.valor, 0)

    const ventasMes = filtrarPorAnio(ventas, 'createdAt')
      .filter(v => new Date(v.createdAt).getMonth() === idx)
      .reduce((acc, v) => acc + getVentaTotal(v), 0)

    return {
      mes: m,
      Servicios: serviciosMes,
      Ventas: ventasMes,
      Total: serviciosMes + ventasMes
    }
  })

  const datosGananciasPorMes = MESES.map((m, idx) => {
    const gananciasServicios = filtrarPorAnio(servicios, 'createdAt')
      .filter(s => new Date(s.createdAt).getMonth() === idx && s.estado === 'completado')
      .reduce((acc, s) => acc + (s.valor - s.pagoInversion), 0)

    const gananciasVentas = filtrarPorAnio(ventas, 'createdAt')
      .filter(v => new Date(v.createdAt).getMonth() === idx)
      .reduce((acc, v) => acc + getVentaGanancia(v), 0)

    return {
      mes: m,
      Ganancia: gananciasServicios + gananciasVentas
    }
  })

  const datosGastosPorMes = MESES.map((m, idx) => {
    const gastosJC = filtrarPorAnio(gastos, 'fecha')
      .filter(g => new Date(g.fecha).getMonth() === idx && g.tipo === 'JC System')
      .reduce((acc, g) => acc + g.valor, 0)

    const gastosPersonal = filtrarPorAnio(gastos, 'fecha')
      .filter(g => new Date(g.fecha).getMonth() === idx && g.tipo === 'Personal')
      .reduce((acc, g) => acc + g.valor, 0)

    return {
      mes: m,
      'JC System': gastosJC,
      Personal: gastosPersonal,
      Total: gastosJC + gastosPersonal
    }
  })

  const cuentasAnio = filtrarPorPeriodo(cuentas, 'createdAt')
  const totalPendiente = cuentasAnio.filter(c => c.estado === 'pendiente').reduce((acc, c) => acc + c.total, 0)
  const totalPagado = cuentasAnio.filter(c => c.estado === 'pagada').reduce((acc, c) => acc + c.total, 0)
  const datosCuentas = [
    { name: 'Pagadas', value: totalPagado },
    { name: 'Pendientes', value: totalPendiente }
  ]

  const ventasAnio = filtrarPorPeriodo(ventas, 'createdAt')
  const datosVentasPorTipo = categoriasVenta.map(cat => {
    const itemsCat = ventasAnio.flatMap(v => v.items || []).filter(i =>
      i.tipoProducto === cat.tipoProducto &&
      (cat.condicion ? i.condicion === cat.condicion : true)
    )
    return {
      tipo: cat.key,
      Cantidad: itemsCat.length,
      'Total Vendido': itemsCat.reduce((acc, i) => acc + i.valorVenta, 0),
      'Total Ganancia': itemsCat.reduce((acc, i) => acc + i.ganancia, 0)
    }
  })

  const datosPorProveedor = compras => {
  const proveedores = {}
  compras.forEach(c => {
    const nombre = c.proveedor_r?.nombre || 'Sin proveedor'
    if (!proveedores[nombre]) {
      proveedores[nombre] = { proveedor: nombre, totalCompras: 0, cantidad: 0 }
    }
    proveedores[nombre].totalCompras += c.valorTotal || 0
    proveedores[nombre].cantidad += c.cantidad || 1
  })
  return Object.values(proveedores).sort((a, b) => b.totalCompras - a.totalCompras)
}

const datosProductosVendidos = (ventasLista) => {
  const productos = {}
  ventasLista.forEach(v => {
    v.items?.forEach(i => {
      const key = i.producto
      if (!productos[key]) {
        productos[key] = { producto: i.producto, tipoProducto: i.tipoProducto || '—', cantidad: 0, totalVendido: 0, totalGanancia: 0 }
      }
      productos[key].cantidad += i.cantidad || 1
      productos[key].totalVendido += i.valorVenta * (i.cantidad || 1)
      productos[key].totalGanancia += i.ganancia
    })
  })
  return Object.values(productos).sort((a, b) => b.totalVendido - a.totalVendido)
}

  const periodoTexto = mes ? `${MESES_COMPLETOS[parseInt(mes) - 1]} ${anio}` : anio

  const gananciaServicios = serviciosPeriodo.reduce((acc, s) => acc + (s.valor - s.pagoInversion), 0)
  const gananciaVentas = ventasPeriodo.reduce((acc, v) => acc + getVentaGanancia(v), 0) 

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes Financieros</h1>
          <p className="text-gray-500">Análisis financiero de JC System</p>
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
              <p className="text-sm text-gray-500">Ingresos por Servicios — {periodoTexto}</p>
              <p className="text-2xl font-bold text-blue-600">{formatCOP(totalIngresosPorServicios)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Ingresos por Ventas — {periodoTexto}</p>
              <p className="text-2xl font-bold text-indigo-600">{formatCOP(totalIngresosPorVentas)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Total Ingresos — {periodoTexto}</p>
              <p className="text-2xl font-bold text-green-600">{formatCOP(totalIngresosPorServicios + totalIngresosPorVentas)}</p>
            </div>
              <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Ganancia Inversionista — {periodoTexto}</p>
              <p className="text-2xl font-bold text-purple-600">{formatCOP(totalGananciInversionista)}</p>
            </div>
        
            <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm text-gray-500">Ganancia Servicios — {periodoTexto}</p>
            <p className="text-2xl font-bold text-blue-600">{formatCOP(gananciaServicios)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-sm text-gray-500">Ganancia Ventas — {periodoTexto}</p>
            <p className="text-2xl font-bold text-indigo-600">{formatCOP(gananciaVentas)}</p>
          </div>
              <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Ganancia Neta — {periodoTexto}</p>
              <p className="text-2xl font-bold text-green-600">{formatCOP(totalGananciaPeriodo)}</p>
            </div>
          
            <div className="bg-white rounded-2xl shadow p-6">
              <p className="text-sm text-gray-500">Total Gastos — {periodoTexto}</p>
              <p className="text-2xl font-bold text-red-500">{formatCOP(totalGastosPeriodo)}</p>
            </div>
          </div>

          {vistaGrafico ? (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Ingresos por Mes</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosIngresosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCOP(value)} />
                    <Legend />
                    <Bar dataKey="Servicios" fill="#3B82F6" />
                    <Bar dataKey="Ventas" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Ganancia Neta por Mes</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datosGananciasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCOP(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="Ganancia" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Gastos por Mes</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosGastosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCOP(value)} />
                    <Legend />
                    <Bar dataKey="JC System" fill="#F59E0B" />
                    <Bar dataKey="Personal" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Cuentas de Cobro {anio}</h2>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={250}>
                    <PieChart>
                      <Pie data={datosCuentas} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${formatCOP(value)}`}>
                        {datosCuentas.map((entry, index) => (
                          <Cell key={index} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCOP(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Pagado</p>
                      <p className="text-xl font-bold text-green-600">{formatCOP(totalPagado)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Pendiente</p>
                      <p className="text-xl font-bold text-yellow-600">{formatCOP(totalPendiente)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Ventas por Tipo de Producto {anio}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosVentasPorTipo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value, name) => name === 'Cantidad' ? value : formatCOP(value)} />
                    <Legend />
                    <Bar dataKey="Total Vendido" fill="#3B82F6" />
                    <Bar dataKey="Total Ganancia" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

             <div className="bg-white rounded-2xl shadow p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Compras por Proveedor — {periodoTexto}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={datosPorProveedor(filtrarPorPeriodo(compras, 'createdAt'))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="proveedor" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCOP(value)} />
                        <Bar dataKey="totalCompras" name="Total Comprado">
                          {datosPorProveedor(filtrarPorAnio(compras, 'createdAt')).map((entry, index) => (
                            <Cell key={index} fill={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316'][index % 7]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-2xl shadow p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Productos Vendidos — {periodoTexto}</h2>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={datosProductosVendidos(ventasPeriodo)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="producto" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value, name) => name === 'Cantidad' ? value : formatCOP(value)} />
                            <Legend />
                            <Bar dataKey="totalVendido" name="Total Vendido" fill="#3B82F6" />
                            <Bar dataKey="totalGanancia" name="Ganancia" fill="#10B981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
              
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Ingresos por Mes</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Mes</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Servicios</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Ventas</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datosIngresosPorMes.map((fila) => (
                      <tr key={fila.mes} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.mes}</td>
                        <td className="px-6 py-3 text-sm text-right text-blue-600">{formatCOP(fila.Servicios)}</td>
                        <td className="px-6 py-3 text-sm text-right text-green-600">{formatCOP(fila.Ventas)}</td>
                        <td className="px-6 py-3 text-sm text-right font-bold text-gray-800">{formatCOP(fila.Total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-sm text-gray-800">Total</td>
                      <td className="px-6 py-3 text-sm text-right text-blue-600">{formatCOP(datosIngresosPorMes.reduce((acc, d) => acc + d.Servicios, 0))}</td>
                      <td className="px-6 py-3 text-sm text-right text-green-600">{formatCOP(datosIngresosPorMes.reduce((acc, d) => acc + d.Ventas, 0))}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-800">{formatCOP(datosIngresosPorMes.reduce((acc, d) => acc + d.Total, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Ganancia Neta por Mes</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Mes</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datosGananciasPorMes.map((fila) => (
                      <tr key={fila.mes} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.mes}</td>
                        <td className="px-6 py-3 text-sm text-right font-bold text-green-600">{formatCOP(fila.Ganancia)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-sm text-gray-800">Total</td>
                      <td className="px-6 py-3 text-sm text-right text-green-600">{formatCOP(datosGananciasPorMes.reduce((acc, d) => acc + d.Ganancia, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Gastos por Mes</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Mes</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">JC System</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Personal</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datosGastosPorMes.map((fila) => (
                      <tr key={fila.mes} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.mes}</td>
                        <td className="px-6 py-3 text-sm text-right text-yellow-600">{formatCOP(fila['JC System'])}</td>
                        <td className="px-6 py-3 text-sm text-right text-purple-600">{formatCOP(fila.Personal)}</td>
                        <td className="px-6 py-3 text-sm text-right font-bold text-red-500">{formatCOP(fila.Total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-sm text-gray-800">Total</td>
                      <td className="px-6 py-3 text-sm text-right text-yellow-600">{formatCOP(datosGastosPorMes.reduce((acc, d) => acc + d['JC System'], 0))}</td>
                      <td className="px-6 py-3 text-sm text-right text-purple-600">{formatCOP(datosGastosPorMes.reduce((acc, d) => acc + d.Personal, 0))}</td>
                      <td className="px-6 py-3 text-sm text-right text-red-500">{formatCOP(datosGastosPorMes.reduce((acc, d) => acc + d.Total, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Cuentas de Cobro {anio}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Cantidad</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-green-600">Pagadas</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-800">{cuentasAnio.filter(c => c.estado === 'pagada').length}</td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-green-600">{formatCOP(totalPagado)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-yellow-600">Pendientes</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-800">{cuentasAnio.filter(c => c.estado === 'pendiente').length}</td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-yellow-600">{formatCOP(totalPendiente)}</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-sm text-gray-800">Total</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-800">{cuentasAnio.length}</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-800">{formatCOP(totalPagado + totalPendiente)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-bold text-gray-800">Ventas por Tipo de Producto {anio}</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Cantidad</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total Vendido</th>
                      <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {datosVentasPorTipo.map((fila) => (
                      <tr key={fila.tipo} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.tipo}</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-800">{fila.Cantidad}</td>
                        <td className="px-6 py-3 text-sm text-right text-blue-600">{formatCOP(fila['Total Vendido'])}</td>
                        <td className="px-6 py-3 text-sm text-right text-green-600">{formatCOP(fila['Total Ganancia'])}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-sm text-gray-800">Total</td>
                      <td className="px-6 py-3 text-sm text-right text-gray-800">{datosVentasPorTipo.reduce((acc, d) => acc + d.Cantidad, 0)}</td>
                      <td className="px-6 py-3 text-sm text-right text-blue-600">{formatCOP(datosVentasPorTipo.reduce((acc, d) => acc + d['Total Vendido'], 0))}</td>
                      <td className="px-6 py-3 text-sm text-right text-green-600">{formatCOP(datosVentasPorTipo.reduce((acc, d) => acc + d['Total Ganancia'], 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              

              <div className="bg-white rounded-2xl shadow overflow-hidden">
                    <div className="px-6 py-4 border-b">
                      <h2 className="text-lg font-bold text-gray-800">Compras por Proveedor {anio}</h2>
                    </div>
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Proveedor</th>
                          <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Unidades</th>
                          <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total Comprado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {datosPorProveedor(filtrarPorPeriodo(compras, 'createdAt')).map((fila) => (
                          <tr key={fila.proveedor} className="hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.proveedor}</td>
                            <td className="px-6 py-3 text-sm text-right text-gray-800">{fila.cantidad}</td>
                            <td className="px-6 py-3 text-sm text-right text-red-500 font-bold">{formatCOP(fila.totalCompras)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td className="px-6 py-3 text-sm text-gray-800">Total</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800">
                            {datosPorProveedor(filtrarPorPeriodo(compras, 'createdAt')).reduce((acc, d) => acc + d.cantidad, 0)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-red-500">
                            {formatCOP(datosPorProveedor(filtrarPorAnio(compras, 'createdAt')).reduce((acc, d) => acc + d.totalCompras, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                        <div className="bg-white rounded-2xl shadow overflow-hidden">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Productos Vendidos {anio}</h2>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Producto</th>
                        <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tipo</th>
                        <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Cantidad</th>
                        <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Total Vendido</th>
                        <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Ganancia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {datosProductosVendidos(ventasPeriodo).map((fila) => (
                        <tr key={fila.producto} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">{fila.producto}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">{fila.tipoProducto}</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800">{fila.cantidad}</td>
                          <td className="px-6 py-3 text-sm text-right text-blue-600">{formatCOP(fila.totalVendido)}</td>
                          <td className="px-6 py-3 text-sm text-right text-green-600">{formatCOP(fila.totalGanancia)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td className="px-6 py-3 text-sm text-gray-800" colSpan="2">Total</td>
                        <td className="px-6 py-3 text-sm text-right text-gray-800">{datosProductosVendidos(ventasAnio).reduce((acc, d) => acc + d.cantidad, 0)}</td>
                        <td className="px-6 py-3 text-sm text-right text-blue-600">{formatCOP(datosProductosVendidos(ventasAnio).reduce((acc, d) => acc + d.totalVendido, 0))}</td>
                        <td className="px-6 py-3 text-sm text-right text-green-600">{formatCOP(datosProductosVendidos(ventasAnio).reduce((acc, d) => acc + d.totalGanancia, 0))}</td>
                      </tr>
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

export default Reportes