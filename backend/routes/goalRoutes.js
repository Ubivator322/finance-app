const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getGoals, createGoal, updateGoal, deleteGoal } = require('../controllers/goalController');

router.get('/', auth, getGoals);           // GET /api/goals
router.post('/', auth, createGoal);        // POST /api/goals
router.patch('/:id', auth, updateGoal);    // PATCH /api/goals/:id (для пополнения/списания)
router.delete('/:id', auth, deleteGoal);   // DELETE /api/goals/:id

module.exports = router;