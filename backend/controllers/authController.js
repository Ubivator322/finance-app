const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

const register = (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (email, name, password) 
      VALUES (?, ?, ?)
    `);
    const info = stmt.run(email, name || email.split('@')[0], hashedPassword);

    const token = generateToken({ id: info.lastInsertRowid, email });

    res.status(201).json({
      success: true,
      token,
      user: { id: info.lastInsertRowid, email, name: name || '', avatar: '👤' }
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }
    res.status(500).json({ message: 'Ошибка регистрации' });
  }
};

const login = (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  const token = generateToken({ id: user.id, email: user.email });

  // Загружаем все данные пользователя
  const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC').all(user.id);
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ?').all(user.id);

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

  res.json({ success: true, token, user: safeUser });
};

module.exports = { register, login };