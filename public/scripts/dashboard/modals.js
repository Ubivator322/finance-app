// ====================== MODALS.JS — НОВАЯ ВЕРСИЯ ДЛЯ API ======================

async function saveExpense() {
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const category = document.getElementById('expenseCategory').value;
  const date = document.getElementById('expenseDate').value || new Date().toISOString().slice(0, 10);
  const desc = document.getElementById('expenseDesc').value.trim();
  const fromGoalId = document.getElementById('expenseFromGoal').value || null;

  if (!amount || amount <= 0 || !category) {
    return showToast('Заполните сумму и категорию', 'error');
  }

  const data = {
    date,
    category,
    amount: -amount,
    desc: desc || 'Расход',
    fromGoalId
  };

  const result = await apiRequest('/transactions', 'POST', data);
  
  if (result.success) {
    await refreshUserData();
    document.getElementById('modalExpense').classList.add('hidden');
    showToast('Расход успешно добавлен', 'success');
  } else {
    showToast(result.message || 'Ошибка добавления расхода', 'error');
  }
}

async function saveIncome() {
  const amount = parseFloat(document.getElementById('incomeAmount').value);
  const category = document.getElementById('incomeCategory').value;
  const date = document.getElementById('incomeDate').value || new Date().toISOString().slice(0, 10);
  const desc = document.getElementById('incomeDesc').value.trim();
  const toGoalId = document.getElementById('incomeToGoal').value || null;

  if (!amount || amount <= 0 || !category) {
    return showToast('Заполните сумму и категорию', 'error');
  }

  const data = {
    date,
    category,
    amount: amount,
    desc: desc || 'Доход',
    toGoalId
  };

  const result = await apiRequest('/transactions', 'POST', data);

  if (result.success) {
    await refreshUserData();
    document.getElementById('modalIncome').classList.add('hidden');
    showToast('Доход успешно добавлен', 'success');
  } else {
    showToast(result.message || 'Ошибка добавления дохода', 'error');
  }
}

// ====================== ПОКАЗ МОДАЛОК ======================
function showExpenseModal() {
  const modal = document.getElementById('modalExpense');
  modal.classList.remove('hidden');

  // Заполняем категории
  const catSelect = document.getElementById('expenseCategory');
  catSelect.innerHTML = currentUser.data.expenseCategories.map(c => 
    `<option value="${c}">${c}</option>`
  ).join('');

  // Заполняем цели
  const goalSelect = document.getElementById('expenseFromGoal');
  goalSelect.innerHTML = `<option value="">Не списывать с цели</option>` +
    (currentUser.data.goals || []).filter(g => g.current > 0)
      .map(g => `<option value="${g.id}">${g.name} (${g.current.toLocaleString()} ₽)</option>`).join('');

  document.getElementById('saveExpense').onclick = saveExpense;
  document.getElementById('cancelExpense').onclick = () => modal.classList.add('hidden');
}

function showIncomeModal() {
  const modal = document.getElementById('modalIncome');
  modal.classList.remove('hidden');

  const catSelect = document.getElementById('incomeCategory');
  catSelect.innerHTML = currentUser.data.incomeCategories.map(c => 
    `<option value="${c}">${c}</option>`
  ).join('');

  const goalSelect = document.getElementById('incomeToGoal');
  goalSelect.innerHTML = `<option value="">Не пополнять цель</option>` +
    (currentUser.data.goals || []).filter(g => g.current < g.target)
      .map(g => `<option value="${g.id}">${g.name} (${g.current.toLocaleString()} / ${g.target.toLocaleString()} ₽)</option>`).join('');

  document.getElementById('saveIncome').onclick = saveIncome;
  document.getElementById('cancelIncome').onclick = () => modal.classList.add('hidden');
}

// ====================== ВСПОМОГАТЕЛЬНЫЕ ======================
window.closeTopUpModal = () => document.getElementById('modalTopUpFromBalance').classList.add('hidden');
window.closeSpendModal = () => document.getElementById('modalSpendFromGoal').classList.add('hidden');