const express = require('express')
const router = express.Router()
const { listarEmpresas, obtenerEmpresa, crearEmpresa, editarEmpresa } = require('../controllers/empresaController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')

router.get('/', verificarToken, soloAdmin, listarEmpresas)
router.get('/:id', verificarToken, soloAdmin, obtenerEmpresa)
router.post('/', verificarToken, soloAdmin, crearEmpresa)
router.put('/:id', verificarToken, soloAdmin, editarEmpresa)

module.exports = router