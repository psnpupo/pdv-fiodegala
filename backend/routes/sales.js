const express = require('express');
const router = express.Router();
const { 
  createSale, 
  getSales, 
  getSaleById, 
  updateSale, 
  deleteSale,
  getProductByBarcode,
  debitStock
} = require('../controllers/salesController');

// Rotas de vendas
router.post('/', createSale);
router.get('/', getSales);
router.get('/:id', getSaleById);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

// Rotas auxiliares
router.get('/products/barcode/:code', getProductByBarcode);
router.post('/stock/debit', debitStock);

module.exports = router; 