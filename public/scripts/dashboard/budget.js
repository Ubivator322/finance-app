// ====================== BUDGET.JS — ПОЛНЫЙ ФАЙЛ ======================

let currentBudgets = [];
let currentMonth = new Date().toISOString().slice(0, 7);

async function renderBudgets() {
  const result = await apiRequest(`/budgets?month=${currentMonth}`);
  if (!result?.success) return;

  currentBudgets = result.budgets;

  const container = document.getElementById('budgetsList');
  container.innerHTML = '';

  const expenseCategories = currentUser.data.expenseCategories || [];

  expenseCategories.forEach(cat => {
    const budget = currentBudgets.find(b => b.category === cat) || { limit_amount: 0 };
    const spent = getSpentByCategory(cat, currentMonth);

    const percent = budget.limit_amount > 0 ? Math.min(Math.round((spent / budget.limit_amount) * 100), 100) : 0;
    const color = percent > 100 ? 'text-red-500' : 'text-emerald-500';

    const div = document.createElement('div');
    div.className = 'bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800';
    div.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div class="font-semibold">${cat}</div>
        <div class="text-right">
          <div class="text-sm text-zinc-500">Потрачено</div>
          <div class="font-bold ${color}">${spent.toLocaleString('ru-RU')} ₽</div>
        </div>
      </div>
      <div class="flex justify-between text-xs mb-2">
        <span class="text-zinc-500">Лимит</span>
        <span class="font-medium">${budget.limit_amount.toLocaleString('ru-RU')} ₽</span>
      </div>
      <div class="bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-3">
        <div class="h-2 rounded-full transition-all ${percent > 100 ? 'bg-red-500' : 'bg-violet-600'}" style="width: ${percent}%"></div>
      </div>
      <button onclick="editBudget('${cat}')" 
              class="w-full py-3 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-3xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
        Изменить лимит
      </button>
    `;
    container.appendChild(div);
  });

  if (expenseCategories.length === 0) {
    container.innerHTML = `<p class="text-center text-zinc-500 py-12">Нет категорий расходов</p>`;
  }
}

function getSpentByCategory(category, month) {
  return currentUser.data.transactions
    .filter(t => t.category === category && t.amount < 0 && t.date.startsWith(month))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

window.editBudget = async function(category) {
  const currentBudget = currentBudgets.find(b => b.category === category);
  const limit = prompt(`Лимит на категорию "${category}" (${currentMonth})`, currentBudget ? currentBudget.limit_amount : '5000');
  
  if (limit === null) return;

  const result = await apiRequest('/budgets', 'POST', {
    category,
    limit_amount: parseFloat(limit),
    month: currentMonth
  });

  if (result?.success) {
    await refreshUserData();
    renderBudgets();
    showToast('Лимит обновлён', 'success');
  }
};

window.setBudgetMonth = function(month) {
  currentMonth = month;
  document.getElementById('budgetMonthTitle').textContent = new Date(month + '-01').toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  renderBudgets();
};

// Автозапуск при переходе на вкладку
window.renderBudgets = renderBudgets;