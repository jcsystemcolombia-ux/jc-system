const express = require('express')
const router = express.Router()
const { listarVentas, obtenerVenta, crearVenta, editarVenta, listarVentasPorCliente } = require('../controllers/ventaController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')

router.get('/', verificarToken, soloAdmin, listarVentas)
router.get('/cliente/:usuarioId', verificarToken, soloAdmin, listarVentasPorCliente)
router.get('/:id', verificarToken, soloAdmin, obtenerVenta)
router.post('/', verificarToken, soloAdmin, crearVenta)
router.put('/:id', verificarToken, soloAdmin, editarVenta)

module.exports = router