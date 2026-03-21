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

  // Проверка существования целей (опционально, но желательно)
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

  // === ОБНОВЛЕНИЕ ЦЕЛЕЙ ===
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