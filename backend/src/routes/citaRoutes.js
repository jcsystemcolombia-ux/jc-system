const express = require('express')
const router = express.Router()
const { listarCitas, listarCitasPendientes, listarCitasPorCliente, obtenerCita, crearCita, actualizarEstadoCita, cancelarCita } = require('../controllers/citaController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')

router.get('/', verificarToken, soloAdmin, listarCitas)
router.get('/pendientes', verificarToken, soloAdmin, listarCitasPendientes)
router.get('/cliente/:usuarioId', verificarToken, listarCitasPorCliente)
router.get('/:id', verificarToken, soloAdmin, obtenerCita)
router.post('/', verificarToken, crearCita)
router.put('/:id/estado', verificarToken, soloAdmin, actualizarEstadoCita)
router.put('/:id/cancelar', verificarToken, cancelarCita)

module.exports = router