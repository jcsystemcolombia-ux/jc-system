const express = require('express')
const router = express.Router()
const { listarGastos, obtenerGasto, crearGasto, editarGasto, listarGastosPorCategoria, listarGastosPorTipo } = require('../controllers/gastoController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')

router.get('/', verificarToken, soloAdmin, listarGastos)
router.get('/categoria/:categoria', verificarToken, soloAdmin, listarGastosPorCategoria)
router.get('/tipo/:tipo', verificarToken, soloAdmin, listarGastosPorTipo)
router.get('/:id', verificarToken, soloAdmin, obtenerGasto)
router.post('/', verificarToken, soloAdmin, crearGasto)
router.put('/:id', verificarToken, soloAdmin, editarGasto)

module.exports = router