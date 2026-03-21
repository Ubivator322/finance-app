const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

// Получить аналитику (с параметром ?period=3|6|12|0)
router.get('/', auth, getAnalytics);

module.exports = router;