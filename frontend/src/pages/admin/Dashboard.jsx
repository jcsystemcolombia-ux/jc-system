import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getClientes, getServicios, getVentas, getCuentasPendientes, getEmpresas, getProveedores } from '../../services/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    clientes: 0,
    empresas: 0,
    proveedores: 0,
    servicios: 0,
    ventas: 0,
    cuentasPendientes: 0,
    totalPendiente: 0
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const [clientes, servicios, ventas, cuentasPendientes, empresas, proveedores] = await Promise.all([
          getClientes(),
          getServicios(),
          getVentas(),
          getCuentasPendientes(),
          getEmpresas(),
          getProveedores()
        ])

        const totalPendiente = cuentasPendientes.data.reduce((acc, cuenta) => acc + cuenta.total, 0)

        setStats({
          clientes: clientes.data.length,
          empresas: empresas.data.length,
          proveedores: proveedores.data.length,
          servicios: servicios.data.length,
          ventas: ventas.data.length,
          cuentasPendientes: cuentasPendientes.data.length,
          totalPendiente
        })
      } catch (error) {
        console.error('Error cargando stats:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarStats()
  }, [])

  const tarjetas = [
    { titulo: 'Empresas', valor: stats.empresas, icono: '🏢', color: 'bg-purple-500' },
    { titulo: 'Clientes', valor: stats.clientes, icono: '👥', color: 'bg-blue-500' },
    { titulo: 'Proveedores', valor: stats.proveedores, icono: '🏭', color: 'bg-yellow-500' },
    { titulo: 'Servicios', valor: stats.servicios, icono: '🔧', color: 'bg-green-500' },
    { titulo: 'Ventas', valor: stats.ventas, icono: '💻', color: 'bg-indigo-500' },
    { titulo: 'Cobros Pendientes', valor: stats.cuentasPendientes, icono: '📄', color: 'bg-orange-500' },
  ]

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Resumen general de JC System</p>
      </div>

      {cargando ? (
        <div className="text-center text-gray-500 py-10">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {tarjetas.map((tarjeta) => (
              <div key={tarjeta.titulo} className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
                <div className={`${tarjeta.color} text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center`}>
                  {tarjeta.icono}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{tarjeta.titulo}</p>
                  <p className="text-2xl font-bold text-gray-800">{tarjeta.valor}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Total por cobrar</h2>
            <p className="text-3xl font-bold text-orange-500">
              ${stats.totalPendiente.toLocaleString('es-CO')}
            </p>
            <p className="text-sm text-gray-500 mt-1">Suma de todas las cuentas pendientes</p>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

export default Dashboard