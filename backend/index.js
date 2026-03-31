const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// === ROUTES ===
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/budgets', require('./routes/budgetRoutes'));   // ← НОВАЯ СТРОКА

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(require('./middleware/errorHandler'));

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
});