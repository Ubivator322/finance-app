// ====================== BUDGET.JS — УЛУЧШЕННАЯ ВЕРСИЯ С ОБЩИМ БЮДЖЕТОМ ======================

let currentBudgets = [];
let currentMonthlyLimit = 0;
let currentMonth = new Date().toISOString().slice(0, 7);

async function renderBudgets() {
  const result = await apiRequest(`/budgets?month=${currentMonth}`);
  if (!result?.success) return;

  currentBudgets = result.budgets;
  currentMonthlyLimit = result.monthlyBudget || 0;

  const totalSpent = currentUser.data.transactions
    .filter(t => t.amount < 0 && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const remaining = currentMonthlyLimit - totalSpent;
  const percent = currentMonthlyLimit > 0 ? Math.min(Math.round((totalSpent / currentMonthlyLimit) * 100), 100) : 0;
  const isOver = percent > 100;

  // === ОБЩИЙ БЮДЖЕТ (большая карточка) ===
  const headerHTML = `
    <div class="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 mb-8">
      <div class="flex justify-between items-start mb-6">
        <div>
          <h3 class="text-lg text-zinc-500">Общий бюджет на месяц</h3>
          <p class="text-5xl font-bold mt-1">${currentMonthlyLimit.toLocaleString('ru-RU')} ₽</p>
        </div>
        <button onclick="editMonthlyBudget()" 
                class="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-3xl text-sm font-medium">
          Изменить
        </button>
      </div>
      
      <div class="bg-zinc-200 dark:bg-zinc-800 rounded-full h-3 mb-4">
        <div class="h-3 rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-violet-600'}" 
             style="width: ${percent}%"></div>
      </div>
      
      <div class="flex justify-between text-sm">
        <div>
          <span class="text-zinc-500">Потрачено</span><br>
          <span class="font-bold text-red-500">${totalSpent.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div class="text-right">
          <span class="text-zinc-500">Осталось</span><br>
          <span class="font-bold ${remaining < 0 ? 'text-red-500' : 'text-emerald-500'}">
            ${remaining.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>
      ${isOver ? `<div class="mt-4 text-red-500 text-center font-medium">⚠️ Бюджет превышен на ${Math.abs(remaining).toLocaleString('ru-RU')} ₽</div>` : ''}
    </div>
  `;

  // === СПИСОК КАТЕГОРИЙ ===
  let categoriesHTML = `<div class="grid grid-cols-2 gap-6">`;
  const expenseCategories = currentUser.data.expenseCategories || [];

  expenseCategories.forEach(cat => {
    const budget = currentBudgets.find(b => b.category === cat) || { limit_amount: 0 };
    const spent = getSpentByCategory(cat, currentMonth);
    const catPercent = budget.limit_amount > 0 ? Math.min(Math.round((spent / budget.limit_amount) * 100), 100) : 0;
    const catOver = catPercent > 100;

    categoriesHTML += `
      <div class="bg-white dark:bg-zinc-900 rounded-3xl p-6 border ${catOver ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}">
        <div class="flex justify-between mb-4">
          <div class="font-semibold">${cat}</div>
          <div class="font-bold ${catOver ? 'text-red-500' : 'text-emerald-500'}">${spent.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div class="bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-3">
          <div class="h-2 rounded-full transition-all ${catOver ? 'bg-red-500' : 'bg-violet-600'}" style="width: ${catPercent}%"></div>
        </div>
        <div class="flex justify-between text-xs text-zinc-500">
          <span>Лимит ${budget.limit_amount.toLocaleString('ru-RU')} ₽</span>
          <button onclick="editBudget('${cat}')" class="text-violet-500 hover:text-violet-600">Изменить</button>
        </div>
      </div>`;
  });

  categoriesHTML += `</div>`;

  document.getElementById('budgetsList').innerHTML = headerHTML + categoriesHTML;
}

function getSpentByCategory(category, month) {
  return currentUser.data.transactions
    .filter(t => t.category === category && t.amount < 0 && t.date.startsWith(month))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

// === МОДАЛКА ДЛЯ ОБЩЕГО БЮДЖЕТА ===
window.editMonthlyBudget = function() {
  const value = prompt(`Общий бюджет на ${currentMonth} (в рублях)`, currentMonthlyLimit || 50000);
  if (value === null) return;

  apiRequest('/budgets/monthly', 'POST', { total_limit: parseFloat(value), month: currentMonth })
    .then(result => {
      if (result?.success) {
        refreshUserData().then(() => renderBudgets());
        showToast('Общий бюджет обновлён', 'success');
      }
    });
};

window.editBudget = function(category) {
  currentEditingCategory = category;
  const budget = currentBudgets.find(b => b.category === category) || { limit_amount: 0 };
  
  document.getElementById('budgetModalTitle').textContent = `Лимит на категорию "${category}" (${currentMonth})`;
  document.getElementById('budgetLimitInput').value = budget.limit_amount || '';
  document.getElementById('modalBudget').classList.remove('hidden');
};

window.saveBudgetLimit = async function() {
  const limit = parseFloat(document.getElementById('budgetLimitInput').value);
  if (!limit || limit <= 0) {
    showToast('Введите корректный лимит', 'error');
    return;
  }

  const result = await apiRequest('/budgets', 'POST', {
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