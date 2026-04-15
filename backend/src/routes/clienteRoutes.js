const express = require('express')
const router = express.Router()
const { listarClientes, obtenerCliente, crearCliente, editarCliente, toggleNotificaciones } = require('../controllers/clienteController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')

router.get('/', verificarToken, soloAdmin, listarClientes)
router.get('/:id', verificarToken, soloAdmin, obtenerCliente)
router.post('/', verificarToken, soloAdmin, crearCliente)
router.put('/:id', verificarToken, soloAdmin, editarCliente)
router.put('/:id/notificaciones', verificarToken, soloAdmin, toggleNotificaciones)

module.exports = router