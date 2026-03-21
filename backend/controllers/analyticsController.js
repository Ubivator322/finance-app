const db = require('../config/db');

const getAnalytics = (req, res) => {
  const period = parseInt(req.query.period) || 6; // 3,6,12,0=всё время

  let query = 'SELECT * FROM transactions WHERE user_id = ?';
  const params = [req.user.id];

  if (period > 0) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - period);
    query += ' AND date >= ?';
    params.push(cutoff.toISOString().slice(0, 10));
  }

  const transactions = db.prepare(query + ' ORDER BY date DESC').all(...params);

  // Подсчёт сводки
  let totalIncome = 0, totalExpense = 0;
  const categoryExpense = {};
  const monthlyData = {};

  transactions.forEach(t => {
    if (t.amount > 0) totalIncome += t.amount;
    else {
      const abs = Math.abs(t.amount);
      totalExpense += abs;
      categoryExpense[t.category] = (categoryExpense[t.category] || 0) + abs;

      const month = t.date.slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expense: 0 };
      if (t.amount > 0) monthlyData[month].income += t.amount;
      else monthlyData[month].expense += abs;
    }
  });

  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome ? Math.round(savings / totalIncome * 100) : 0;
  const topCategory = Object.entries(categoryExpense).sort((a, b) => b[1] - a[1])[0] || ['—', 0];

  res.json({
    success: true,
    summary: {
      avgExpense: Math.round(totalExpense / Object.keys(monthlyData).length) || 0,
      savings,
      savingsRate,
      topCategory: topCategory[0],
      topAmount: topCategory[1],
      transactionCount: transactions.length
    },
    incomeExpenseChart: monthlyData,
    categoryPie: categoryExpense
  });
};

module.exports = { getAnalytics };