
function renderAnalytics() {
  renderSummaryCards();
  renderIncomeExpenseChart();
  renderCategoryPieChart();
  renderTopExpenseChart();
  renderMonthlyTable();
}

function renderSummaryCards() {
  let trans = filterTransactionsByPeriod(currentUser.data.transactions || []);
  trans = getRealTransactions(trans);   // ← ИСКЛЮЧАЕМ переводы

  let totalIncome = 0, totalExpense = 0;
  trans.forEach(t => t.amount > 0 ? totalIncome += t.amount : totalExpense += Math.abs(t.amount));
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(savings / totalIncome * 100) : 0;
  const avgExpense = trans.length ? Math.round(totalExpense / getUniqueMonths(trans)) : 0;
  const catExpense = {};
  trans.filter(t => t.amount < 0).forEach(t => catExpense[t.category] = (catExpense[t.category] || 0) + Math.abs(t.amount));
  const topCat = Object.entries(catExpense).sort((a,b) => b[1]-a[1])[0] || ['—', 0];

  document.getElementById('analyticsSummary').innerHTML = `
    <div class="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
      <p class="text-xs text-zinc-500">Средний расход в месяц</p>
      <p class="text-3xl font-bold mt-1">${avgExpense.toLocaleString('ru-RU')} ₽</p>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
      <p class="text-xs text-zinc-500">Накопления</p>
      <p class="text-3xl font-bold mt-1 ${savings >= 0 ? 'text-green-500' : 'text-red-500'}">${savings.toLocaleString('ru-RU')} ₽</p>
      <p class="text-xs text-zinc-500 mt-1">${savingsRate}% от доходов</p>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
      <p class="text-xs text-zinc-500">Самая большая трата</p>
      <p class="text-3xl font-bold mt-1 text-red-500">${topCat[0]}</p>
      <p class="text-xs text-zinc-500 mt-1">${topCat[1].toLocaleString('ru-RU')} ₽</p>
    </div>
    <div class="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
      <p class="text-xs text-zinc-500">Операций</p>
      <p class="text-3xl font-bold mt-1">${trans.length}</p>
    </div>
  `;
}

function renderIncomeExpenseChart() {
  const ctx = document.getElementById('incomeExpenseChart');
  if (incomeExpenseChart) incomeExpenseChart.destroy();
  let trans = filterTransactionsByPeriod(currentUser.data.transactions || []);
  trans = getRealTransactions(trans);   // ← ИСКЛЮЧАЕМ переводы
  const data = getMonthlyData(trans);
  incomeExpenseChart = new Chart(ctx, {
    type: 'line',
    data: { labels: data.labels, datasets: [
      { label: 'Доходы', data: data.income, borderColor: '#10b981', tension: 0.4, borderWidth: 3 },
      { label: 'Расходы', data: data.expense, borderColor: '#ef4444', tension: 0.4, borderWidth: 3 }
    ]},
    options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
  });
}

function renderCategoryPieChart() {
  const ctx = document.getElementById('categoryPieChart');
  if (categoryPieChart) categoryPieChart.destroy();
  let trans = filterTransactionsByPeriod(currentUser.data.transactions || []);
  trans = getRealTransactions(trans);   // ← ИСКЛЮЧАЕМ переводы
  const dataByCat = {};
  trans.filter(t => t.amount < 0).forEach(t => dataByCat[t.category] = (dataByCat[t.category] || 0) + Math.abs(t.amount));
  categoryPieChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: Object.keys(dataByCat), datasets: [{ data: Object.values(dataByCat), backgroundColor: ['#ef4444','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#14b8a6'] }] },
    options: { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom' } } }
  });
}

function renderTopExpenseChart() {
  const ctx = document.getElementById('topExpenseChart');
  if (topExpenseChart) topExpenseChart.destroy();
  let trans = filterTransactionsByPeriod(currentUser.data.transactions || []);
  trans = getRealTransactions(trans);   // ← ИСКЛЮЧАЕМ переводы
  const dataByCat = {};
  trans.filter(t => t.amount < 0).forEach(t => dataByCat[t.category] = (dataByCat[t.category] || 0) + Math.abs(t.amount));
  const sorted = Object.entries(dataByCat).sort((a,b) => b[1]-a[1]).slice(0,7);
  topExpenseChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: sorted.map(([cat]) => cat), datasets: [{ data: sorted.map(([,val]) => val), backgroundColor: '#ef4444', borderRadius: 8 }] },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }
  });
}

function renderMonthlyTable() {
  let trans = filterTransactionsByPeriod(currentUser.data.transactions || []);
  trans = getRealTransactions(trans);   // ← ИСКЛЮЧАЕМ переводы
  const data = getMonthlyData(trans);
  let html = `<thead><tr class="border-b"><th class="text-left py-3 px-4">Месяц</th><th class="text-right py-3 px-4">Доходы</th><th class="text-right py-3 px-4">Расходы</th><th class="text-right py-3 px-4">Баланс</th></tr></thead><tbody>`;
  data.labels.forEach((month, i) => {
    const inc = data.income[i], exp = data.expense[i], bal = inc - exp;
    html += `<tr class="border-b last:border-0"><td class="py-3 px-4">${month}</td><td class="py-3 px-4 text-right text-green-500">${inc.toLocaleString('ru-RU')} ₽</td><td class="py-3 px-4 text-right text-red-500">${exp.toLocaleString('ru-RU')} ₽</td><td class="py-3 px-4 text-right ${bal >= 0 ? 'text-green-500' : 'text-red-500'}">${bal.toLocaleString('ru-RU')} ₽</td></tr>`;
  });
  html += '</tbody>';
  document.getElementById('monthlyTable').innerHTML = html;
}

window.setPeriod = function (months) {
  currentPeriod = months;
  document.querySelectorAll('.period-btn').forEach(b => {
    b.classList.remove('active', 'bg-zinc-100', 'dark:bg-zinc-800');
    if (parseInt(b.dataset.period) === months) b.classList.add('active', 'bg-zinc-100', 'dark:bg-zinc-800');
  });
  renderAnalytics();
};

window.exportAnalytics = function () {
  const trans = filterTransactionsByPeriod(currentUser.data.transactions || []);
  const data = trans.map(t => ({ Дата: t.date, Тип: t.amount > 0 ? 'Доход' : 'Расход', Категория: t.category, Сумма: Math.abs(t.amount), Описание: t.desc || '' }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Аналитика");
  XLSX.writeFile(wb, `аналитика_${currentUser.name || 'user'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast('Аналитика экспортирована!', 'success');
};