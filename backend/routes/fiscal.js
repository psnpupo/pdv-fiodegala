const express = require('express');
const router = express.Router();
const fiscalController = require('../controllers/fiscalController');

// Obter configurações fiscais
router.get('/config', fiscalController.getFiscalConfig);

// Salvar configurações fiscais
router.post('/config', fiscalController.saveFiscalConfig);

// Gerar NF-e
router.post('/generate-nfe', fiscalController.generateNFe);

// Gerar SAT
router.post('/generate-sat', fiscalController.generateSAT);

// Enviar documento fiscal
router.post('/send-document', fiscalController.sendFiscalDocument);

// Obter documentos fiscais
router.get('/documents', fiscalController.getFiscalDocuments);

module.exports = router; 