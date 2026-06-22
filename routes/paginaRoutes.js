const express = require('express');
const router = express.Router();

const paginaController = require('../controllers/paginaController');

router.get('/', paginaController.home);
router.get('/produtos', paginaController.produtos);
router.get('/contato', paginaController.contato);
router.post('/contato', paginaController.salvarContato);

module.exports = router;