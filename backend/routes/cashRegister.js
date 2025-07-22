const express = require('express');
const router = express.Router();
const { 
  getCashRegisterState, 
  openCashRegister, 
  closeCashRegister, 
  getCashRegisterLogs,
  addCashRegisterLog,
  resetCashRegister
} = require('../controllers/cashRegisterController');

// Rotas de controle de caixa
router.get('/state', getCashRegisterState);
router.post('/open', openCashRegister);
router.post('/close', closeCashRegister);
router.get('/logs', getCashRegisterLogs);
router.post('/logs', addCashRegisterLog);
router.delete('/reset/:store_id', resetCashRegister);

module.exports = router; 