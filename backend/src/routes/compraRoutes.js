const express = require('express')
const router = express.Router()
const { listarCompras, listarComprasDisponibles, obtenerCompra, crearCompra, editarCompra, agregarStock } = require('../controllers/compraController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')


router.get('/', verificarToken, soloAdmin, listarCompras)
router.get('/disponibles', verificarToken, soloAdmin, listarComprasDisponibles)
router.get('/:id', verificarToken, soloAdmin, obtenerCompra)
router.post('/', verificarToken, soloAdmin, crearCompra)
router.put('/:id', verificarToken, soloAdmin, editarCompra)
router.put('/:id/stock', verificarToken, soloAdmin, agregarStock)


module.exports = router