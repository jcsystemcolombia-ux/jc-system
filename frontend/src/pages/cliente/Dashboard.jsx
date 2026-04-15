import { useState, useEffect } from 'react'
import ClienteLayout from '../../components/ClienteLayout'
import { useAuth } from '../../context/AuthContext'
import { getCuentasPorCliente, getServiciosPorCliente, getCitasPorCliente } from '../../services/api'

const Dashboard = () => {
  const { usuario } = useAuth()
  const [stats, setStats] = useState({
    servicios: 0,
    cuentasPendientes: 0,
    totalPendiente: 0,
    proximaCita: null
  })
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const promesas = [
          getServiciosPorCliente(usuario.id),
          getCitasPorCliente(usuario.id)
        ]

        if (usuario.rol === 'cliente') {
          promesas.push(getCuentasPorCliente(usuario.id))
        }

        const resultados = await Promise.all(promesas)
        const serviciosRes = resultados[0]
        const citasRes = resultados[1]
        const cuentasRes = usuario.rol === 'cliente' ? resultados[2] : null

        const cuentasPendientes = cuentasRes ? cuentasRes.data.filter(c => c.estado === 'pendiente') : []
        const totalPendiente = cuentasPendientes.reduce((acc, c) => acc + c.total, 0)

        const citasFuturas = citasRes.data
          .filter(c => c.estado !== 'cancelada' && new Date(c.fecha) >= new Date())
          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

        setStats({
          servicios: serviciosRes.data.length,
          cuentasPendientes: cuentasPendientes.length,
          totalPendiente,
          proximaCita: citasFuturas[0] || null
        })
      } catch (error) {
        console.error('Error cargando stats:', error)
      } finally {
        setCargando(false)
      }
    }

    if (usuario) cargarStats()
  }, [usuario])

  return (
    <ClienteLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {usuario?.nombre} 👋</h1>
        <p className="text-gray-500">Aquí puedes ver el resumen de tu cuenta</p>
      </div>

      {cargando ? (
        <div className="text-center text-gray-500 py-10">Cargando...</div>
      ) : (
        <>
          <div className={`grid grid-cols-1 gap-4 mb-8 ${usuario?.rol === 'cliente' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
              <div className="bg-blue-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">🔧</div>
              <div>
                <p className="text-sm text-gray-500">Servicios</p>
                <p className="text-2xl font-bold text-gray-800">{stats.servicios}</p>
              </div>
            </div>

            {usuario?.rol === 'cliente' && (
              <>
                <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
                  <div className="bg-orange-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">📄</div>
                  <div>
                    <p className="text-sm text-gray-500">Cuentas Pendientes</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.cuentasPendientes}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
                  <div className="bg-red-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">💰</div>
                  <div>
                    <p className="text-sm text-gray-500">Total por Pagar</p>
                    <p className="text-2xl font-bold text-gray-800">${stats.totalPendiente.toLocaleString('es-CO')}</p>
                  </div>
                </div>
              </>
            )}

            <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
              <div className="bg-green-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">📅</div>
              <div>
                <p className="text-sm text-gray-500">Próxima Cita</p>
                <p className="text-sm font-bold text-gray-800">
                  {stats.proximaCita ? new Date(stats.proximaCita.fecha).toLocaleDateString('es-CO') : 'Sin citas'}
                </p>
              </div>
            </div>
          </div>

          {stats.proximaCita && (
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3">📅 Próxima Cita</h2>
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 text-blue-700 px-4 py-3 rounded-xl text-center">
                  <p className="text-2xl font-bold">{new Date(stats.proximaCita.fecha).getDate()}</p>
                  <p className="text-xs">{new Date(stats.proximaCita.fecha).toLocaleDateString('es-CO', { month: 'long' })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{stats.proximaCita.hora}</p>
                  <p className="text-sm text-gray-600">{stats.proximaCita.descripcion || 'Servicio técnico'}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${stats.proximaCita.estado === 'confirmada' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {stats.proximaCita.estado}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!stats.proximaCita && (
            <div className="bg-white rounded-2xl shadow p-6 text-center">
              <p className="text-gray-400 mb-3">No tienes citas programadas</p>
              <a href="/cliente/agendar" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                Agendar una cita
              </a>
            </div>
          )}
        </>
      )}
    </ClienteLayout>
  )
}

export default Dashboard