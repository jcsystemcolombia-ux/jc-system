const express = require('express')
const router = express.Router()
const { obtenerConfig, actualizarConfig } = require('../controllers/configRecordatoriosController')
const { verificarToken, soloAdmin } = require('../middlewares/authMiddleware')

router.get('/', verificarToken, soloAdmin, obtenerConfig)
router.put('/', verificarToken, soloAdmin, actualizarConfig)

module.exports = router