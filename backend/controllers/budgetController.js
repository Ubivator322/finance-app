const db = require('../config/db');

const getBudgets = (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const budgets = db.prepare(`
    SELECT * FROM budgets 
    WHERE user_id = ? AND month = ?
  `).all(req.user.id, month);

  res.json({ success: true, budgets });
};

const saveBudget = (req, res) => {
  const { category, limit_amount, month } = req.body;
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  if (!category || !limit_amount || limit_amount <= 0) {
    return res.status(400).json({ message: 'Категория и лимит обязательны' });
  }

  // Удаляем старый лимит (чтобы можно было обновить)
  db.prepare('DELETE FROM budgets WHERE user_id = ? AND category = ? AND month = ?')
    .run(req.user.id, category, currentMonth);

  const stmt = db.prepare(`
    INSERT INTO budgets (user_id, category, month, limit_amount)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(req.user.id, category, currentMonth, limit_amount);

  res.json({ success: true, message: 'Бюджет сохранён' });
};

module.exports = { getBudgets, saveBudget };