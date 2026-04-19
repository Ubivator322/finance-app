// ====================== MODALS.JS — ЗАЩИТА ОТ МИНУСА ======================

// ====================== МОДАЛКА РАСХОДА ======================
window.showExpenseModal = function() {
  const modal = document.getElementById('modalExpense');
  modal.classList.remove('hidden');

  const catSelect = document.getElementById('expenseCategory');
  catSelect.innerHTML = currentUser.data.expenseCategories
    .map(c => `<option value="${c}">${c}</option>`).join('');

  const goalSelect = document.getElementById('expenseFromGoal');
  goalSelect.innerHTML = `<option value="">Не списывать с цели</option>` +
    (currentUser.data.goals || []).map(g => 
      `<option value="${g.id}">${g.name} (${g.current.toLocaleString('ru-RU')} ₽)</option>`).join('');

  document.getElementById('expenseDate').value = new Date().toISOString().slice(0, 10);

  document.getElementById('saveExpense').onclick = saveExpense;
  document.getElementById('cancelExpense').onclick = () => modal.classList.add('hidden');
};

// ====================== МОДАЛКА ДОХОДА ======================
window.showIncomeModal = function() {
  const modal = document.getElementById('modalIncome');
  modal.classList.remove('hidden');

  const catSelect = document.getElementById('incomeCategory');
  catSelect.innerHTML = currentUser.data.incomeCategories
    .map(c => `<option value="${c}">${c}</option>`).join('');

  const goalSelect = document.getElementById('incomeToGoal');
  goalSelect.innerHTML = `<option value="">Не пополнять цель</option>` +
    (currentUser.data.goals || []).map(g => 
      `<option value="${g.id}">${g.name}</option>`).join('');

  document.getElementById('incomeDate').value = new Date().toISOString().slice(0, 10);

  document.getElementById('saveIncome').onclick = saveIncome;
  document.getElementById('cancelIncome').onclick = () => modal.classList.add('hidden');
};

// ====================== СОХРАНЕНИЕ РАСХОДА (ЗАЩИТА ОТ МИНУСА) ======================
async function saveExpense() {
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const category = document.getElementById('expenseCategory').value;
  const date = document.getElementById('expenseDate').value || new Date().toISOString().slice(0, 10);
  const desc = document.getElementById('expenseDesc').value.trim();
  const fromGoalId = document.getElementById('expenseFromGoal').value;

  if (!amount || amount <= 0 || !category) {
    return showToast('Заполните сумму и категорию', 'error');
  }

  // === ГЛАВНАЯ ЗАЩИТА: НЕ ДАЁМ УЙТИ В МИНУС ===
  const currentBalance = currentUser.data.transactions.reduce((sum, t) => sum + t.amount, 0);
  if (currentBalance - amount < 0) {
    return showToast('Невозможно! Баланс станет отрицательным', 'error');
  }
  // =============================================

  const result = await apiRequest('/transactions', 'POST', {
    date,
    category,
    amount: -amount,
    desc: desc || 'Расход',
    fromGoalId: fromGoalId || null
  });

  if (result?.success) {
    await refreshUserData();
    document.getElementById('modalExpense').classList.add('hidden');
    showToast('Расход добавлен', 'success');
  } else {
    showToast(result?.message || 'Ошибка', 'error');
  }
}

// ====================== СОХРАНЕНИЕ ДОХОДА ======================
async function saveIncome() {
  const amount = parseFloat(document.getElementById('incomeAmount').value);
  const category = document.getElementById('incomeCategory').value;
  const date = document.getElementById('incomeDate').value || new Date().toISOString().slice(0, 10);
  const desc = document.getElementById('incomeDesc').value.trim();
  const toGoalId = document.getElementById('incomeToGoal').value;

  if (!amount || amount <= 0 || !category) {
    return showToast('Заполните сумму и категорию', 'error');
  }

  const result = await apiRequest('/transactions', 'POST', {
    date,
    category,
    amount: amount,
    desc: desc || 'Доход',
    toGoalId: toGoalId || null
  });

  if (result?.success) {
    await refreshUserData();
    document.getElementById('modalIncome').classList.add('hidden');
    showToast('Доход добавлен', 'success');
  } else {
    showToast(result?.message || 'Ошибка', 'error');
  }
}

window.closeTopUpModal = () => document.getElementById('modalTopUpFromBalance').classList.add('hidden');
window.closeSpendModal = () => document.getElementById('modalSpendFromGoal').classList.add('hidden');