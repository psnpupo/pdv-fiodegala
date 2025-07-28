const express = require('express');
const router = express.Router();
const peripheralsController = require('../controllers/peripheralsController');

// Testar impressora
router.post('/test-printer', peripheralsController.testPrinter);

// Testar scanner
router.post('/test-scanner', peripheralsController.testScanner);

// Ler código de barras
router.post('/scan-barcode', peripheralsController.scanBarcode);

// Imprimir recibo
router.post('/print-receipt', peripheralsController.printReceipt);

// Obter configurações de periféricos
router.get('/config', peripheralsController.getPeripheralConfig);

// Salvar configurações de periféricos
router.post('/config', peripheralsController.savePeripheralConfig);

// Detectar dispositivos
router.get('/detect-devices', peripheralsController.detectDevices);

module.exports = router; 