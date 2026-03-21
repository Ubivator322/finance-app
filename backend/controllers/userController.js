const db = require('../config/db');
const { generateToken } = require('../utils/jwt');

// Получить текущего пользователя (с данными)
const getUser = (req, res) => {
  const user = db.prepare('SELECT id, email, name, avatar FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

  const transactions = db.prepare(`
    SELECT * FROM transactions 
    WHERE user_id = ? 
    ORDER BY date DESC, created_at DESC
  `).all(req.user.id);

  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(req.user.id);

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    data: {
      transactions,
      goals,
      expenseCategories: ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Одежда', 'Здоровье', 'Красота', 'Связь', 'Другое'],
      incomeCategories: ['Зарплата', 'Фриланс', 'Инвестиции', 'Подарки', 'Пенсия', 'Возврат долга', 'Другие доходы']
    }
  };

  res.json({ success: true, user: safeUser });
};

// Обновить профиль (имя + аватар)
const updateUser = (req, res) => {
  const { name, avatar } = req.body;

  const stmt = db.prepare(`
    UPDATE users 
    SET name = ?, avatar = ? 
    WHERE id = ?
  `);
  stmt.run(name || null, avatar || '👤', req.user.id);

  res.json({ success: true, message: 'Профиль обновлён' });
};

// Очистить все расходы
const clearExpenses = (req, res) => {
  db.prepare(`
    DELETE FROM transactions 
    WHERE user_id = ? AND amount < 0
  `).run(req.user.id);
  res.json({ success: true });
};

// Очистить все доходы
const clearIncomes = (req, res) => {
  db.prepare(`
    DELETE FROM transactions 
    WHERE user_id = ? AND amount > 0
  `).run(req.user.id);
  res.json({ success: true });
};

// Очистить ВСЮ историю
const clearAll = (req, res) => {
  db.prepare('DELETE FROM transactions WHERE user_id = ?').run(req.user.id);
  db.prepare('DELETE FROM goals WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
};

module.exports = { 
  getUser, 
  updateUser, 
  clearExpenses, 
  clearIncomes, 
  clearAll 
};