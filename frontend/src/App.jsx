import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/admin/Dashboard'
import Empresas from './pages/admin/Empresas'
import Clientes from './pages/admin/Clientes'
import Servicios from './pages/admin/Servicios'
import Ventas from './pages/admin/Ventas'
import Compras from './pages/admin/Compras'
import Gastos from './pages/admin/Gastos'
import CuentasCobro from './pages/admin/CuentasCobro'
import Agenda from './pages/admin/Agenda'
import Reportes from './pages/admin/Reportes'
import Proveedores from './pages/admin/Proveedores'
import ClienteDashboard from './pages/cliente/Dashboard'
import MisServicios from './pages/cliente/MisServicios'
import MisCuentas from './pages/cliente/MisCuentas'
import AgendarCita from './pages/cliente/AgendarCita'
import ReportesOperativos from './pages/admin/ReportesOperativos'
import ReportesGarantias from './pages/admin/ReportesGarantias'

const RutaProtegida = ({ children, rol }) => {
  const { usuario, cargando } = useAuth()

  if (cargando) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  if (!usuario) return <Navigate to="/" />
  if (rol === 'cliente' && usuario.rol !== 'cliente' && usuario.rol !== 'subcliente') return <Navigate to="/" />
  if (rol === 'admin' && usuario.rol !== 'admin') return <Navigate to="/" />

  return children
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Rutas Admin */}
      <Route path="/admin/dashboard" element={<RutaProtegida rol="admin"><Dashboard /></RutaProtegida>} />
      <Route path="/admin/empresas" element={<RutaProtegida rol="admin"><Empresas /></RutaProtegida>} />
      <Route path="/admin/clientes" element={<RutaProtegida rol="admin"><Clientes /></RutaProtegida>} />
      <Route path="/admin/servicios" element={<RutaProtegida rol="admin"><Servicios /></RutaProtegida>} />
      <Route path="/admin/ventas" element={<RutaProtegida rol="admin"><Ventas /></RutaProtegida>} />
      <Route path="/admin/compras" element={<RutaProtegida rol="admin"><Compras /></RutaProtegida>} />
      <Route path="/admin/proveedores" element={<RutaProtegida rol="admin"><Proveedores /></RutaProtegida>} />
      <Route path="/admin/gastos" element={<RutaProtegida rol="admin"><Gastos /></RutaProtegida>} />
      <Route path="/admin/cuentas-cobro" element={<RutaProtegida rol="admin"><CuentasCobro /></RutaProtegida>} />
      <Route path="/admin/agenda" element={<RutaProtegida rol="admin"><Agenda /></RutaProtegida>} />
      <Route path="/admin/reportes" element={<Navigate to="/admin/reportes/financieros" />} />
      <Route path="/admin/reportes/financieros" element={<RutaProtegida rol="admin"><Reportes /></RutaProtegida>} />
      <Route path="/admin/reportes/operativos" element={<RutaProtegida rol="admin"><ReportesOperativos /></RutaProtegida>} />
      <Route path="/admin/reportes/garantias" element={<RutaProtegida rol="admin"><ReportesGarantias /></RutaProtegida>} />

      {/* Rutas Cliente */}
      <Route path="/cliente/dashboard" element={<RutaProtegida rol="cliente"><ClienteDashboard /></RutaProtegida>} />
      <Route path="/cliente/servicios" element={<RutaProtegida rol="cliente"><MisServicios /></RutaProtegida>} />
      <Route path="/cliente/cuentas" element={<RutaProtegida rol="cliente"><MisCuentas /></RutaProtegida>} />
      <Route path="/cliente/agendar" element={<RutaProtegida rol="cliente"><AgendarCita /></RutaProtegida>} />
    </Routes>
  )
}

export default App