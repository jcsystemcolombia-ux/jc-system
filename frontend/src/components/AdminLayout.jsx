import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const ReportesMenu = [
  { nombre: 'Financieros', ruta: '/admin/reportes/financieros', icono: '💰' },
  { nombre: 'Operativos', ruta: '/admin/reportes/operativos', icono: '📊' },
  { nombre: 'Garantías', ruta: '/admin/reportes/garantias', icono: '🔧' },
]

const menu = [
  { nombre: 'Dashboard', ruta: '/admin/dashboard', icono: '📊' },
  { nombre: 'Empresas', ruta: '/admin/empresas', icono: '🏢' },
  { nombre: 'Clientes', ruta: '/admin/clientes', icono: '👥' },
  { nombre: 'Proveedores', ruta: '/admin/proveedores', icono: '🏭' },
  { nombre: 'Servicios', ruta: '/admin/servicios', icono: '🔧' },
  { nombre: 'Ventas', ruta: '/admin/ventas', icono: '💻' },
  { nombre: 'Compras', ruta: '/admin/compras', icono: '🛒' },
  { nombre: 'Gastos', ruta: '/admin/gastos', icono: '💸' },
  { nombre: 'Cuentas de Cobro', ruta: '/admin/cuentas-cobro', icono: '📄' },
  { nombre: 'Agenda', ruta: '/admin/agenda', icono: '📅' },
]

const AdminLayout = ({ children }) => {
  const { usuario, logout } = useAuth()
  const { modoOscuro, toggleModoOscuro } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [reportesAbierto, setReportesAbierto] = useState(
    location.pathname.startsWith('/admin/reportes')
  )
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const esActivo = (ruta) => location.pathname === ruta

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-blue-900 dark:bg-gray-800 text-white flex flex-col transition-all duration-300`}>
        <div className={`px-4 py-5 border-b border-blue-800 dark:border-gray-700 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold">JC System</h1>
              <p className="text-xs text-blue-300 dark:text-gray-400 mt-1">{usuario?.nombre}</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-blue-300 hover:text-white transition text-lg"
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menu.map((item) => (
            <Link
              key={item.ruta}
              to={item.ruta}
              title={collapsed ? item.nombre : ''}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                esActivo(item.ruta)
                  ? 'bg-blue-700 dark:bg-blue-600 text-white'
                  : 'text-blue-100 hover:bg-blue-800 dark:hover:bg-gray-700'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="text-lg">{item.icono}</span>
              {!collapsed && <span>{item.nombre}</span>}
            </Link>
          ))}

          {/* Menú Reportes desplegable */}
          <div>
            <button
              onClick={() => !collapsed && setReportesAbierto(!reportesAbierto)}
              title={collapsed ? 'Reportes' : ''}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                location.pathname.startsWith('/admin/reportes')
                  ? 'bg-blue-700 dark:bg-blue-600 text-white'
                  : 'text-blue-100 hover:bg-blue-800 dark:hover:bg-gray-700'
              } ${collapsed ? 'justify-center' : 'justify-between'}`}
            >
              <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                <span className="text-lg">📈</span>
                {!collapsed && <span>Reportes</span>}
              </div>
              {!collapsed && <span className="text-xs">{reportesAbierto ? '▲' : '▼'}</span>}
            </button>

            {!collapsed && reportesAbierto && (
              <div className="ml-4 mt-1 space-y-1">
                {ReportesMenu.map((item) => (
                  <Link
                    key={item.ruta}
                    to={item.ruta}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      esActivo(item.ruta)
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-200 hover:bg-blue-800 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{item.icono}</span>
                    <span>{item.nombre}</span>
                  </Link>
                ))}
              </div>
            )}

            {collapsed && (
              <div className="mt-1 space-y-1">
                {ReportesMenu.map((item) => (
                  <Link
                    key={item.ruta}
                    to={item.ruta}
                    title={item.nombre}
                    className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition ${
                      esActivo(item.ruta)
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-200 hover:bg-blue-800 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{item.icono}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className={`px-4 py-4 border-t border-blue-800 dark:border-gray-700 flex ${collapsed ? 'justify-center flex-col gap-3 items-center' : 'justify-between items-center'}`}>
          {collapsed ? (
            <>
              <button
                onClick={toggleModoOscuro}
                title={modoOscuro ? 'Modo claro' : 'Modo oscuro'}
                className="text-blue-300 hover:text-white transition text-lg"
              >
                {modoOscuro ? '☀️' : '🌙'}
              </button>
              <button onClick={handleLogout} title="Cerrar sesión" className="text-red-300 hover:text-red-100 transition text-lg">🚪</button>
            </>
          ) : (
            <>
              <button onClick={handleLogout} className="text-sm text-red-300 hover:text-red-100 transition">Cerrar sesión</button>
              <button
                onClick={toggleModoOscuro}
                className="text-blue-300 hover:text-white transition text-lg"
                title={modoOscuro ? 'Modo claro' : 'Modo oscuro'}
              >
                {modoOscuro ? '☀️' : '🌙'}
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        {children}
      </main>
    </div>
  )
}

export default AdminLayout