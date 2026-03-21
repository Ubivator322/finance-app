const db = require('../config/db');

const getGoals = (req, res) => {
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user.id);
  res.json({ success: true, goals });
};

const createGoal = (req, res) => {
  const { name, target, deadline } = req.body;
  if (!name || !target || target <= 0) {
    return res.status(400).json({ message: 'Название и сумма цели обязательны' });
  }

  const stmt = db.prepare(`
    INSERT INTO goals (user_id, name, target, deadline) 
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(req.user.id, name, target, deadline || null);

  res.json({ success: true, goalId: info.lastInsertRowid });
};

const updateGoal = (req, res) => {
  const { id } = req.params;
  const { current, amount, action } = req.body; // action: 'topup' или 'spend'

  if (action === 'topup') {
    db.prepare('UPDATE goals SET current = current + ? WHERE id = ? AND user_id = ?')
      .run(amount, id, req.user.id);
  } else if (action === 'spend') {
    db.prepare('UPDATE goals SET current = current - ? WHERE id = ? AND user_id = ?')
      .run(amount, id, req.user.id);
  }

  res.json({ success: true });
};

const deleteGoal = (req, res) => {
  db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };