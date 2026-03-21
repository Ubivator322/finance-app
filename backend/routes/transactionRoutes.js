const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTransactions, createTransaction, deleteTransaction } = require('../controllers/transactionController');

router.get('/', auth, getTransactions);           // GET /api/transactions
router.post('/', auth, createTransaction);        // POST /api/transactions
router.delete('/:id', auth, deleteTransaction);   // DELETE /api/transactions/:id

module.exports = router;