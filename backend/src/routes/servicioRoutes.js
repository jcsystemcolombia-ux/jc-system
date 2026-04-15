const express = require('express')
const router = express.Router()
const { listarServicios, obtenerServicio, crearServicio, editarServicio, listarServiciosPorCliente } = require('../controllers/servicioController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')

router.get('/', verificarToken, soloAdmin, listarServicios)
router.get('/cliente/:usuarioId', verificarToken, listarServiciosPorCliente)
router.get('/:id', verificarToken, soloAdmin, obtenerServicio)
router.post('/', verificarToken, soloAdmin, crearServicio)
router.put('/:id', verificarToken, soloAdmin, editarServicio)

module.exports = router