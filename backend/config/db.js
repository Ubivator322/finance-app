const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('/tmp/finance-app.db');

// ====================== СОЗДАНИЕ ТАБЛИЦ ======================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT '👤',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    desc TEXT,
    fromGoalId INTEGER,
    toGoalId INTEGER,
    isGoalReturn INTEGER DEFAULT 0,
    fromBalanceToGoal INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (fromGoalId) REFERENCES goals(id) ON DELETE SET NULL,
    FOREIGN KEY (toGoalId) REFERENCES goals(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    target REAL NOT NULL,
    current REAL DEFAULT 0,
    deadline TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- НОВАЯ ТАБЛИЦА ДЛЯ БЮДЖЕТА
  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    month TEXT NOT NULL,           -- YYYY-MM
    limit_amount REAL NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('✅ База данных инициализирована (SQLite + better-sqlite3)');

module.exports = db;