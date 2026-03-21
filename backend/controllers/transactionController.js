const db = require('../config/db');

// Получить все операции
const getTransactions = (req, res) => {
  const transactions = db.prepare(`
    SELECT * FROM transactions 
    WHERE user_id = ? 
    ORDER BY date DESC, created_at DESC
  `).all(req.user.id);

  res.json({ success: true, transactions });
};

// Добавить операцию (обычный расход/доход + логика целей)
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

  // === ЛОГИКА ЦЕЛЕЙ ===
  if (toGoalId) {
    // Доход → пополнение цели
    db.prepare('UPDATE goals SET current = current + ? WHERE id = ? AND user_id = ?')
      .run(Math.abs(amount), toGoalId, req.user.id);
  }

  if (fromGoalId) {
    // Расход со цели
    db.prepare('UPDATE goals SET current = current - ? WHERE id = ? AND user_id = ?')
      .run(Math.abs(amount), fromGoalId, req.user.id);
  }

  if (fromBalanceToGoal) {
    // Пополнение цели из баланса (уже учтено в amount = -)
    // goal.current уже обновляется в фронте, но на всякий случай дублируем
    db.prepare('UPDATE goals SET current = current + ? WHERE id = ? AND user_id = ?')
      .run(Math.abs(amount), fromGoalId || toGoalId, req.user.id);
  }

  res.json({ success: true, transactionId: info.lastInsertRowid });
};

// Удалить операцию
const deleteTransaction = (req, res) => {
  const { id } = req.params;

  // Получаем транзакцию перед удалением
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').get(id, req.user.id);
  
  if (tx) {
    // Если это операция с целью — откатываем сумму
    if (tx.toGoalId) {
      db.prepare('UPDATE goals SET current = current - ? WHERE id = ?')
        .run(Math.abs(tx.amount), tx.toGoalId);
    }
    if (tx.fromGoalId) {
      db.prepare('UPDATE goals SET current = current + ? WHERE id = ?')
        .run(Math.abs(tx.amount), tx.fromGoalId);
    }
  }

  db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, req.user.id);
  res.json({ success: true });
};

module.exports = { 
  getTransactions, 
  createTransaction, 
  deleteTransaction 
};