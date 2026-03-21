
function renderOverview() {
  let trans = currentUser.data.transactions || [];
  trans = getRealTransactions(trans);

  let freeBalance = 0, totalExpense = 0, totalIncome = 0;

  trans.forEach(t => {
    if (t.amount < 0) {
      freeBalance += t.amount;
      totalExpense += Math.abs(t.amount);
    } else {
      freeBalance += t.amount;
      totalIncome += t.amount;
    }
  });

  document.getElementById('totalBalance').textContent = freeBalance.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('totalExpense').textContent = totalExpense.toLocaleString('ru-RU') + ' ₽';
  document.getElementById('totalIncome').textContent = totalIncome.toLocaleString('ru-RU') + ' ₽';

  renderTransactions();
  renderCategoryChart();
}

function renderTransactions() {
  const list = document.getElementById('transactionsList');
  const trans = currentUser.data.transactions.slice(0, 12);
  list.innerHTML = trans.map(t => `
    <div class="flex justify-between items-center bg-zinc-100 dark:bg-zinc-800 rounded-3xl px-6 py-4">
      <div><div class="font-medium">${t.category}</div><div class="text-xs text-zinc-500">${t.date}</div></div>
      <div class="font-bold ${t.amount < 0 ? 'text-red-500' : 'text-green-500'}">${t.amount.toLocaleString('ru-RU')} ₽</div>
    </div>
  `).join('');
}

function renderCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (categoryChart && typeof categoryChart.destroy === 'function') {
    categoryChart.destroy();
  }
  let trans = getRealTransactions(currentUser.data.transactions || []);
  const dataByCat = {};
  trans.filter(t => t.amount < 0).forEach(t => {
    dataByCat[t.category] = (dataByCat[t.category] || 0) + Math.abs(t.amount);
  });
  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: Object.keys(dataByCat), datasets: [{ data: Object.values(dataByCat), backgroundColor: ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6'] }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
  });
}