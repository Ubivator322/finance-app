const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getBudgets, 
  saveCategoryBudget, 
  saveMonthlyBudget 
} = require('../controllers/budgetController');

// Получить все бюджеты (категорийные + общий)
router.get('/', auth, getBudgets);

// Сохранить бюджет по категории
router.post('/category', auth, saveCategoryBudget);

// Сохранить общий месячный бюджет
router.post('/monthly', auth, saveMonthlyBudget);

module.exports = router;