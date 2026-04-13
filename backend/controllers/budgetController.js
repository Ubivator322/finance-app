const db = require('../config/db');

const getBudgets = (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  // Категорийные бюджеты
  const categoryBudgets = db.prepare(`
    SELECT * FROM budgets 
    WHERE user_id = ? AND month = ?
  `).all(req.user.id, month);

  // Общий бюджет
  const monthlyBudget = db.prepare(`
    SELECT total_limit FROM monthly_budgets 
    WHERE user_id = ? AND month = ?
  `).get(req.user.id, month);

  res.json({ 
    success: true, 
    budgets: categoryBudgets,
    monthlyBudget: monthlyBudget ? monthlyBudget.total_limit : 0 
  });
};

const saveCategoryBudget = (req, res) => {
  const { category, limit_amount, month } = req.body;
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  db.prepare('DELETE FROM budgets WHERE user_id = ? AND category = ? AND month = ?')
    .run(req.user.id, category, currentMonth);

  db.prepare(`
    INSERT INTO budgets (user_id, category, month, limit_amount)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, category, currentMonth, limit_amount);

  res.json({ success: true });
};

const saveMonthlyBudget = (req, res) => {
  const { total_limit, month } = req.body;
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  if (!total_limit || total_limit <= 0) {
    return res.status(400).json({ message: 'Общий бюджет должен быть больше 0' });
  }

  db.prepare('DELETE FROM monthly_budgets WHERE user_id = ? AND month = ?')
    .run(req.user.id, currentMonth);

  db.prepare(`
    INSERT INTO monthly_budgets (user_id, month, total_limit)
    VALUES (?, ?, ?)
  `).run(req.user.id, currentMonth, total_limit);

  res.json({ success: true, message: 'Общий бюджет сохранён' });
};

module.exports = { getBudgets, saveCategoryBudget, saveMonthlyBudget };