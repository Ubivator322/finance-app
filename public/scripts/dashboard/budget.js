// ====================== BUDGET.JS — КРАСИВАЯ ВЕРСИЯ ======================

let currentBudgets = [];
let currentMonthlyLimit = 0;
let currentMonth = new Date().toISOString().slice(0, 7);

async function renderBudgets() {
  const result = await apiRequest(`/budgets?month=${currentMonth}`);
  if (!result?.success) return;

  currentBudgets = result.budgets || [];
  currentMonthlyLimit = result.monthlyBudget || 0;

  const totalSpent = currentUser.data.transactions
    .filter(t => t.amount < 0 && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const remaining = currentMonthlyLimit - totalSpent;
  const percent = currentMonthlyLimit > 0 ? Math.min(Math.round((totalSpent / currentMonthlyLimit) * 100), 100) : 0;
  const isOver = percent > 100;

  // Большая карточка общего бюджета
  let html = `
    <div class="bg-white dark:bg-zinc-900 rounded-3xl p-8 border ${isOver ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} mb-10">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-semibold">Общий бюджет на месяц</h3>
        <button onclick="editMonthlyBudget()" class="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-3xl">Изменить</button>
      </div>
      <div class="text-6xl font-bold mb-2">${currentMonthlyLimit.toLocaleString('ru-RU')} ₽</div>
      <div class="flex justify-between text-sm mb-4">
        <span class="text-red-500">Потрачено ${totalSpent.toLocaleString('ru-RU')} ₽</span>
        <span class="${remaining < 0 ? 'text-red-500' : 'text-emerald-500'}">Осталось ${remaining.toLocaleString('ru-RU')} ₽</span>
      </div>
      <div class="bg-zinc-200 dark:bg-zinc-800 rounded-full h-4 mb-2">
        <div class="h-4 rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-violet-600'}" style="width: ${percent}%"></div>
      </div>
      ${isOver ? `<p class="text-red-500 text-center font-medium mt-3">⚠️ Бюджет превышен на ${Math.abs(remaining).toLocaleString('ru-RU')} ₽</p>` : ''}
    </div>
  `;

  // Список категорий
  html += `<div class="grid grid-cols-2 gap-6">`;
  const categories = currentUser.data.expenseCategories || [];

  categories.forEach(cat => {
    const budget = currentBudgets.find(b => b.category === cat) || { limit_amount: 0 };
    const spent = getSpentByCategory(cat, currentMonth);
    const catPercent = budget.limit_amount > 0 ? Math.min(Math.round((spent / budget.limit_amount) * 100), 100) : 0;
    const catOver = catPercent > 100;

    html += `
      <div class="bg-white dark:bg-zinc-900 rounded-3xl p-6 border ${catOver ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}">
        <div class="flex justify-between mb-3">
          <span class="font-medium">${cat}</span>
          <span class="font-bold ${catOver ? 'text-red-500' : 'text-emerald-500'}">${spent.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div class="bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 mb-4">
          <div class="h-2.5 rounded-full ${catOver ? 'bg-red-500' : 'bg-violet-600'}" style="width: ${catPercent}%"></div>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-zinc-500">Лимит ${budget.limit_amount.toLocaleString('ru-RU')} ₽</span>
          <button onclick="editBudget('${cat}')" class="text-violet-500 hover:text-violet-600 font-medium">Изменить</button>
        </div>
      </div>`;
  });

  html += `</div>`;

  document.getElementById('budgetsList').innerHTML = html;
}

function getSpentByCategory(category, month) {
  return currentUser.data.transactions
    .filter(t => t.category === category && t.amount < 0 && t.date.startsWith(month))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

// ====================== МОДАЛКИ ======================
let currentEditingCategory = null;

window.editMonthlyBudget = function() {
  document.getElementById('monthlyBudgetTitle').textContent = `Общий бюджет на ${currentMonth}`;
  document.getElementById('monthlyBudgetInput').value = currentMonthlyLimit || '';
  document.getElementById('modalMonthlyBudget').classList.remove('hidden');
};

window.saveMonthlyBudget = async function() {
  const limit = parseFloat(document.getElementById('monthlyBudgetInput').value);
  if (!limit || limit <= 0) return showToast('Введите сумму больше 0', 'error');

  const result = await apiRequest('/budgets/monthly', 'POST', { total_limit: limit, month: currentMonth });
  if (result?.success) {
    closeMonthlyBudgetModal();
    await refreshUserData();
    renderBudgets();
    showToast('Общий бюджет сохранён', 'success');
  }
};

window.closeMonthlyBudgetModal = function() {
  document.getElementById('modalMonthlyBudget').classList.add('hidden');
};

window.editBudget = function(category) {
  currentEditingCategory = category;
  const budget = currentBudgets.find(b => b.category === category) || { limit_amount: 0 };
  document.getElementById('budgetModalTitle').textContent = `Лимит на "${category}"`;
  document.getElementById('budgetLimitInput').value = budget.limit_amount || '';
  document.getElementById('modalBudget').classList.remove('hidden');
};

window.saveBudgetLimit = async function() {
  const limit = parseFloat(document.getElementById('budgetLimitInput').value);
  if (!limit || limit <= 0) return showToast('Введите сумму больше 0', 'error');

  const result = await apiRequest('/budgets/category', 'POST', {
    category: currentEditingCategory,
    limit_amount: limit,
    month: currentMonth
  });

  if (result?.success) {
    closeBudgetModal();
    await refreshUserData();
    renderBudgets();
    showToast('Лимит сохранён', 'success');
  }
};

window.closeBudgetModal = function() {
  document.getElementById('modalBudget').classList.add('hidden');
  currentEditingCategory = null;
};

window.setBudgetMonth = function(month) {
  currentMonth = month;
  document.getElementById('budgetMonthTitle').textContent = 
    new Date(month + '-01').toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  renderBudgets();
};

window.renderBudgets = renderBudgets;