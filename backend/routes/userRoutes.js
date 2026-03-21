const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUser, updateUser, clearExpenses, clearIncomes, clearAll } = require('../controllers/userController');

router.get('/', auth, getUser);                    // GET /api/user
router.put('/', auth, updateUser);                 // PUT /api/user (имя + аватар)

router.delete('/clear-expenses', auth, clearExpenses);
router.delete('/clear-incomes', auth, clearIncomes);
router.delete('/clear-all', auth, clearAll);

module.exports = router;