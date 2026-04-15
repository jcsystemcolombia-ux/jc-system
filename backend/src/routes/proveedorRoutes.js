const express = require('express')
const router = express.Router()
const { listarProveedores, obtenerProveedor, crearProveedor, editarProveedor } = require('../controllers/proveedorController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')

router.get('/', verificarToken, soloAdmin, listarProveedores)
router.get('/:id', verificarToken, soloAdmin, obtenerProveedor)
router.post('/', verificarToken, soloAdmin, crearProveedor)
router.put('/:id', verificarToken, soloAdmin, editarProveedor)

module.exports = router