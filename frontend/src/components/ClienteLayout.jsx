import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ClienteLayout = ({ children }) => {
  const { usuario, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const menu = [
    { nombre: 'Inicio', ruta: '/cliente/dashboard', icono: '🏠' },
    { nombre: 'Mis Servicios', ruta: '/cliente/servicios', icono: '🔧' },
    ...(usuario?.rol === 'cliente' ? [{ nombre: 'Mis Cuentas', ruta: '/cliente/cuentas', icono: '📄' }] : []),
    { nombre: 'Agendar Cita', ruta: '/cliente/agendar', icono: '📅' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">JC System</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-300">Hola, {usuario?.nombre}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-300 hover:text-red-100 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6 flex gap-2">
          {menu.map((item) => (
            <Link
              key={item.ruta}
              to={item.ruta}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                location.pathname === item.ruta
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-blue-600'
              }`}
            >
              <span>{item.icono}</span>
              <span>{item.nombre}</span>
            </Link>
          ))}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

export default ClienteLayout