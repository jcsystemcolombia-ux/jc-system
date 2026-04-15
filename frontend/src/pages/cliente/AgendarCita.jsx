import { useState, useEffect } from 'react'
import ClienteLayout from '../../components/ClienteLayout'
import { useAuth } from '../../context/AuthContext'
import { crearCita, getCitasPorCliente, cancelarCita } from '../../services/api'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

const anios = Array.from({ length: 2028 - 2018 + 1 }, (_, i) => 2018 + i)

const tiposServicio = [
  'Soporte Técnico',
  'Instalación Sistema Operativo',
  'Reparación de Portátil',
  'Instalación de Programas',
  'Configuración de Red',
  'Mantenimiento Preventivo'
]

const colorEstado = (estado) => {
  const colores = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    confirmada: 'bg-blue-100 text-blue-700',
    completada: 'bg-green-100 text-green-700',
    cancelada: 'bg-red-100 text-red-700'
  }
  return colores[estado] || 'bg-gray-100 text-gray-700'
}

const colorEstadoCalendario = (estado) => {
  const colores = {
    pendiente: '#F59E0B',
    confirmada: '#3B82F6',
    completada: '#10B981',
    cancelada: '#EF4444'
  }
  return colores[estado] || '#6B7280'
}

const esDomingo = (fechaStr) => {
  if (!fechaStr) return false
  const fecha = new Date(fechaStr + 'T00:00:00')
  return fecha.getDay() === 0
}

const esSabado = (fechaStr) => {
  if (!fechaStr) return false
  const fecha = new Date(fechaStr + 'T00:00:00')
  return fecha.getDay() === 6
}

const obtenerHorasDisponibles = (fechaStr) => {
  if (!fechaStr) return []

  const ahora = new Date()
  const fechaSeleccionada = new Date(fechaStr + 'T00:00:00')
  const esHoy = fechaSeleccionada.toDateString() === ahora.toDateString()

  const horasLunesViernes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
  const horasSabado = ['09:00', '10:00', '11:00', '12:00', '13:00']

  const horas = esSabado(fechaStr) ? horasSabado : horasLunesViernes

  if (!esHoy) return horas

  const horaActual = ahora.getHours()
  const minutosActuales = ahora.getMinutes()

  return horas.filter(hora => {
    const [h] = hora.split(':').map(Number)
    // Si los minutos actuales son > 0 sumar 1 hora extra al límite
    const limiteHora = minutosActuales > 0 ? horaActual + 4 : horaActual + 3
    return h >= limiteHora
  })
}

const obtenerFechaMinima = () => {
  const ahora = new Date()
  const hora = ahora.getHours()
  const diaSemana = ahora.getDay() // 0=dom, 1=lun, 6=sab

  // Si es sábado después de las 11am o domingo, mínimo el lunes siguiente
  if (diaSemana === 0) {
    // Domingo → lunes
    const lunes = new Date(ahora)
    lunes.setDate(ahora.getDate() + 1)
    return lunes.toISOString().split('T')[0]
  }

  if (diaSemana === 6 && hora >= 11) {
    // Sábado >= 11am → lunes
    const lunes = new Date(ahora)
    lunes.setDate(ahora.getDate() + 2)
    return lunes.toISOString().split('T')[0]
  }

  // Si son las 2pm (14) o más y no quedan horas disponibles → mañana
  if (hora >= 14) {
    const manana = new Date(ahora)
    manana.setDate(ahora.getDate() + 1)
    // Si mañana es domingo saltar al lunes
    if (manana.getDay() === 0) {
      manana.setDate(manana.getDate() + 1)
    }
    return manana.toISOString().split('T')[0]
  }

  return ahora.toISOString().split('T')[0]
}

const formatearFecha = (fechaStr) => {
  const fecha = fechaStr.split('T')[0]
  const [anio, mes, dia] = fecha.split('-')
  return new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia))
    .toLocaleDateString('es-CO')
}

const obtenerDia = (fechaStr) => {
  const fecha = fechaStr.split('T')[0]
  const [anio, mes, dia] = fecha.split('-')
  return parseInt(dia)
}

const obtenerMesCorto = (fechaStr) => {
  const fecha = fechaStr.split('T')[0]
  const [anio, mes, dia] = fecha.split('-')
  return new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia))
    .toLocaleDateString('es-CO', { month: 'short' })
}

const AgendarCita = () => {
  const { usuario } = useAuth()
  const [citas, setCitas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear().toString())
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalDetalle, setModalDetalle] = useState(false)
  const [citaDetalle, setCitaDetalle] = useState(null)
  const [vistaCalendario, setVistaCalendario] = useState(true)
  const [form, setForm] = useState({ fecha: '', hora: '', tipoServicio: '', descripcion: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarCitas()
  }, [usuario])

  const cargarCitas = async () => {
    try {
      const { data } = await getCitasPorCliente(usuario.id)
      setCitas(data)
    } catch (error) {
      console.error('Error cargando citas:', error)
    } finally {
      setCargando(false)
    }
  }

  const handleCrearCita = async (e) => {
    e.preventDefault()
    if (esDomingo(form.fecha)) {
      setError('No hay atención los domingos')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const descripcionFinal = form.descripcion
        ? `${form.tipoServicio} - ${form.descripcion}`
        : form.tipoServicio
      await crearCita({ fecha: form.fecha, hora: form.hora, descripcion: descripcionFinal, usuarioId: usuario.id })
      await cargarCitas()
      setModalAbierto(false)
      setForm({ fecha: '', hora: '', tipoServicio: '', descripcion: '' })
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al agendar cita')
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = async (id) => {
    try {
      await cancelarCita(id)
      await cargarCitas()
      setModalDetalle(false)
    } catch (error) {
      console.error('Error cancelando cita:', error)
    }
  }

const eventosCalendario = citas
  .filter(cita => {
    if (cita.estado !== 'cancelada') return true
    const tieneReemplazo = citas.some(c =>
      c.id !== cita.id &&
      c.fecha.split('T')[0] === cita.fecha.split('T')[0] &&
      c.hora === cita.hora &&
      c.estado !== 'cancelada'
    )
    return !tieneReemplazo
  })
  .map(cita => ({
    id: String(cita.id),
    title: `${cita.hora} - ${cita.descripcion || 'Servicio técnico'}`,
    date: cita.fecha.split('T')[0],
    backgroundColor: colorEstadoCalendario(cita.estado),
    borderColor: colorEstadoCalendario(cita.estado),
    extendedProps: { cita }
  }))

  const handleEventoClick = (info) => {
    const cita = info.event.extendedProps.cita
    setCitaDetalle(cita)
    setModalDetalle(true)
  }

  const citasFiltradas = citas.filter(c => {
    const fechaStr = c.fecha.split('T')[0]
    const [anio, mes] = fechaStr.split('-')
    const cumpleEstado = filtroEstado ? c.estado === filtroEstado : true
    const cumpleMes = filtroMes ? parseInt(mes) === parseInt(filtroMes) : true
    const cumpleAnio = filtroAnio ? anio === filtroAnio : true
    return cumpleEstado && cumpleMes && cumpleAnio
  })

  return (
    <ClienteLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Citas</h1>
          <p className="text-gray-500">Agenda y gestiona tus citas</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => setVistaCalendario(true)}
              className={`px-4 py-2 text-sm font-medium transition ${vistaCalendario ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              📅 Calendario
            </button>
            <button
              onClick={() => setVistaCalendario(false)}
              className={`px-4 py-2 text-sm font-medium transition ${!vistaCalendario ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              📋 Listado
            </button>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Agendar Cita
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-center text-gray-500 py-10">Cargando...</div>
      ) : vistaCalendario ? (
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span><span className="text-xs text-gray-600">Pendiente</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span><span className="text-xs text-gray-600">Confirmada</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span><span className="text-xs text-gray-600">Completada</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span><span className="text-xs text-gray-600">Cancelada</span></div>
          </div>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="es"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek'
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana'
            }}
            events={eventosCalendario}
            eventClick={handleEventoClick}
            height="auto"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setFiltroEstado('')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === '' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Todas</button>
              <button onClick={() => setFiltroEstado('pendiente')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'pendiente' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Pendiente</button>
              <button onClick={() => setFiltroEstado('confirmada')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'confirmada' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Confirmada</button>
              <button onClick={() => setFiltroEstado('completada')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'completada' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Completada</button>
              <button onClick={() => setFiltroEstado('cancelada')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtroEstado === 'cancelada' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Cancelada</button>
            </div>
            <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
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
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Todos los años</option>
              {anios.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {citasFiltradas.map((cita) => (
              <div key={cita.id} className="bg-white rounded-2xl shadow p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center text-center">
                    <div>
                      <p className="text-lg font-bold leading-none">{obtenerDia(cita.fecha)}</p>
                      <p className="text-xs">{obtenerMesCorto(cita.fecha)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{cita.hora}</p>
                    <p className="text-xs text-gray-500">{cita.descripcion || 'Servicio técnico'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(cita.estado)}`}>
                    {cita.estado}
                  </span>
                  <button
                    onClick={() => { setCitaDetalle(cita); setModalDetalle(true) }}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Ver
                  </button>
                  {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                    <button
                      onClick={() => handleCancelar(cita.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
            {citasFiltradas.length === 0 && (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                No tienes citas agendadas
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal detalle */}
      {modalDetalle && citaDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalle de la Cita</h2>
              <button onClick={() => setModalDetalle(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Fecha</p>
                  <p className="text-sm text-gray-800">{formatearFecha(citaDetalle.fecha)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Hora</p>
                  <p className="text-sm text-gray-800">{citaDetalle.hora}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Servicio</p>
                <p className="text-sm text-gray-800">{citaDetalle.descripcion || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Estado</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorEstado(citaDetalle.estado)}`}>
                  {citaDetalle.estado}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              {citaDetalle.estado !== 'cancelada' && citaDetalle.estado !== 'completada' && (
                <button
                  onClick={() => handleCancelar(citaDetalle.id)}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200 transition"
                >
                  Cancelar Cita
                </button>
              )}
              <button onClick={() => setModalDetalle(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agendar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Agendar Nueva Cita</h2>
            {error && <div className="bg-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-700 font-medium">Horarios de atención</p>
              <p className="text-xs text-blue-600">Lunes a Viernes: 8:00 AM — 4:00 PM</p>
              <p className="text-xs text-blue-600">Sábados: 9:00 AM — 1:00 PM</p>
            </div>
            <form onSubmit={handleCrearCita} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Servicio *</label>
                <select
                  value={form.tipoServicio}
                  onChange={(e) => setForm({ ...form, tipoServicio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo de servicio</option>
                  {tiposServicio.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
               <input
                    type="date"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value, hora: '' })}
                    min={obtenerFechaMinima()}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {form.fecha && esDomingo(form.fecha) && (
                    <p className="text-xs text-red-500 mt-1">No hay atención los domingos</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                  <select
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!form.fecha || esDomingo(form.fecha)}
                  >
                    <option value="">Seleccionar hora</option>
                    {obtenerHorasDisponibles(form.fecha).map((hora) => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción adicional</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe brevemente el problema o detalle adicional..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <button type="submit" disabled={guardando || esDomingo(form.fecha)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50">
                  {guardando ? 'Agendando...' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ClienteLayout>
  )
}

export default AgendarCita