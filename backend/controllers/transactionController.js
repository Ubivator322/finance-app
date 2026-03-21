const db = require('../config/db');

const getTransactions = (req, res) => {
  const transactions = db.prepare(`
    SELECT * FROM transactions 
    WHERE user_id = ? 
    ORDER BY date DESC, created_at DESC
  `).all(req.user.id);
  res.json({ success: true, transactions });
};

const createTransaction = (req, res) => {
  const { 
    date, 
    category, 
    amount, 
    desc, 
    fromGoalId, 
    toGoalId, 
    fromBalanceToGoal, 
    isGoalReturn 
  } = req.body;

  if (!date || !category || !amount) {
    return res.status(400).json({ message: 'Дата, категория и сумма обязательны' });
  }

  // Проверка целей
  if (toGoalId) {
    const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(toGoalId, req.user.id);
    if (!goal) return res.status(400).json({ message: 'Цель не найдена' });
  }
  if (fromGoalId) {
    const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(fromGoalId, req.user.id);
    if (!goal) return res.status(400).json({ message: 'Цель не найдена' });
    if (goal.current < Math.abs(amount)) return res.status(400).json({ message: 'Недостаточно средств на цели' });
  }

  const stmt = db.prepare(`
    INSERT INTO transactions (
      user_id, date, category, amount, desc, 
      fromGoalId, toGoalId, fromBalanceToGoal, isGoalReturn
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    req.user.id,
    date,
    category,
    amount,
    desc || '',
    fromGoalId || null,
    toGoalId || null,
    fromBalanceToGoal ? 1 : 0,
    isGoalReturn ? 1 : 0
  );

  // Обновление баланса целей
  if (toGoalId) {
    db.prepare('UPDATE goals SET current = current + ? WHERE id = ? AND user_id = ?')
      .run(Math.abs(amount), toGoalId, req.user.id);
  }
  if (fromGoalId) {
    db.prepare('UPDATE goals SET current = current - ? WHERE id = ? AND user_id = ?')
      .run(Math.abs(amount), fromGoalId, req.user.id);
  }

  res.json({ success: true, transactionId: info.lastInsertRowid });
};

const deleteTransaction = (req, res) => {
  const { id } = req.params;
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (tx) {
    if (tx.toGoalId) {
      db.prepare('UPDATE goals SET current = current - ? WHERE id = ?').run(Math.abs(tx.amount), tx.toGoalId);
    }
    if (tx.fromGoalId) {
      db.prepare('UPDATE goals SET current = current + ? WHERE id = ?').run(Math.abs(tx.amount), tx.fromGoalId);
    }
  }
  db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, req.user.id);
  res.json({ success: true });
};

module.exports = { getTransactions, createTransaction, deleteTransaction };