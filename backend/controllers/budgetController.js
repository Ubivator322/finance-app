const db = require('../config/db');

const getBudgets = (req, res) => {
  const { month } = req.query; // YYYY-MM
  const budgets = db.prepare(`
    SELECT * FROM budgets 
    WHERE user_id = ? AND month = ?
  `).all(req.user.id, month || new Date().toISOString().slice(0, 7));
  res.json({ success: true, budgets });
};

const saveBudget = (req, res) => {
  const { category, limit_amount, month } = req.body;
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  // Удаляем старый лимит, если был
  db.prepare('DELETE FROM budgets WHERE user_id = ? AND category = ? AND month = ?')
    .run(req.user.id, category, currentMonth);

  const stmt = db.prepare(`
    INSERT INTO budgets (user_id, category, month, limit_amount)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(req.user.id, category, currentMonth, limit_amount);

  res.json({ success: true });
};

module.exports = { getBudgets, saveBudget };