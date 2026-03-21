const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Определяем путь к файлу базы данных
// На Render используем /tmp, иначе локальную папку data в корне проекта
const dbPath = process.env.RENDER
  ? '/tmp/finance.db'
  : path.join(__dirname, '../../data/finance.db');

// Убеждаемся, что папка для базы данных существует (только для локальной разработки)
if (!process.env.RENDER) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

// Создаём подключение
const db = new Database(dbPath);

module.exports = db;