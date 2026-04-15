const express = require('express')
const router = express.Router()
const { listarCuentasCobro, listarCuentasPendientes, listarCuentasPorCliente, obtenerCuentaCobro, marcarComoPagada, generarPDF } = require('../controllers/cuentaCobroController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')

router.get('/', verificarToken, soloAdmin, listarCuentasCobro)
router.get('/pendientes', verificarToken, soloAdmin, listarCuentasPendientes)
router.get('/cliente/:usuarioId', verificarToken, listarCuentasPorCliente)
router.get('/:id', verificarToken, soloAdmin, obtenerCuentaCobro)
router.get('/:id/pdf', verificarToken, generarPDF)
router.put('/:id/pagar', verificarToken, soloAdmin, marcarComoPagada)

module.exports = router