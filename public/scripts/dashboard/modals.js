// ====================== MODALS.JS — ПОЛНАЯ ВЕРСИЯ (с show*Modal) ======================

// ====================== МОДАЛКА РАСХОДА ======================
window.showExpenseModal = function() {
  const modal = document.getElementById('modalExpense');
  
  // Заполняем категории расходов
  const catSelect = document.getElementById('expenseCategory');
  catSelect.innerHTML = currentUser.data.expenseCategories
    .map(cat => `<option value="${cat}">${cat}</option>`).join('');

  // Заполняем цели (списать с цели)
  const goalSelect = document.getElementById('expenseFromGoal');
  goalSelect.innerHTML = '<option value="">Не списывать с цели</option>' +
    (currentUser.data.goals || []).map(g => 
      `<option value="${g.id}">${g.name} (${g.current.toLocaleString('ru-RU')} ₽)</option>`
    ).join('');

  // Дата сегодня
  document.getElementById('expenseDate').value = new Date().toISOString().slice(0, 10);

  // Привязываем кнопки
  document.getElementById('saveExpense').onclick = saveExpense;
  document.getElementById('cancelExpense').onclick = () => modal.classList.add('hidden');

  modal.classList.remove('hidden');
};

// ====================== МОДАЛКА ДОХОДА ======================
window.showIncomeModal = function() {
  const modal = document.getElementById('modalIncome');
  
  // Заполняем категории доходов
  const catSelect = document.getElementById('incomeCategory');
  catSelect.innerHTML = currentUser.data.incomeCategories
    .map(cat => `<option value="${cat}">${cat}</option>`).join('');

  // Заполняем цели (пополнить цель)
  const goalSelect = document.getElementById('incomeToGoal');
  goalSelect.innerHTML = '<option value="">Не пополнять цель</option>' +
    (currentUser.data.goals || []).map(g => 
      `<option value="${g.id}">${g.name} (${g.current.toLocaleString('ru-RU')} / ${g.target.toLocaleString('ru-RU')} ₽)</option>`
    ).join('');

  // Дата сегодня
  document.getElementById('incomeDate').value = new Date().toISOString().slice(0, 10);

  // Привязываем кнопки
  document.getElementById('saveIncome').onclick = saveIncome;
  document.getElementById('cancelIncome').onclick = () => modal.classList.add('hidden');

  modal.classList.remove('hidden');
};

// ====================== СОХРАНЕНИЕ (уже было, но оставил для полноты) ======================
async function saveExpense() {
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const category = document.getElementById('expenseCategory').value;
  const date = document.getElementById('expenseDate').value || new Date().toISOString().slice(0, 10);
  const desc = document.getElementById('expenseDesc').value.trim();
  const fromGoalIdRaw = document.getElementById('expenseFromGoal').value;

  if (!amount || amount <= 0 || !category) return showToast('Заполните сумму и категорию', 'error');

  const data = { date, category, amount: -amount, desc: desc || 'Расход' };

  if (fromGoalIdRaw) {
    const goalId = parseInt(fromGoalIdRaw);
    const goal = currentUser.data.goals.find(g => g.id === goalId);
    if (!goal) return showToast('Цель не найдена', 'error');
    if (goal.current < amount) return showToast(`Недостаточно на цели "${goal.name}"`, 'error');
    data.fromGoalId = goalId;
  }

  const result = await apiRequest('/transactions', 'POST', data);
  if (result?.success) {
    await refreshUserData();
    document.getElementById('modalExpense').classList.add('hidden');
    showToast('Расход добавлен ✅', 'success');
  } else {
    showToast(result?.message || 'Ошибка', 'error');
  }
}

async function saveIncome() {
  const amount = parseFloat(document.getElementById('incomeAmount').value);
  const category = document.getElementById('incomeCategory').value;
  const date = document.getElementById('incomeDate').value || new Date().toISOString().slice(0, 10);
  const desc = document.getElementById('incomeDesc').value.trim();
  const toGoalIdRaw = document.getElementById('incomeToGoal').value;

  if (!amount || amount <= 0 || !category) return showToast('Заполните сумму и категорию', 'error');

  const data = { date, category, amount, desc: desc || 'Доход' };

  if (toGoalIdRaw) {
    const goalId = parseInt(toGoalIdRaw);
    const goal = currentUser.data.goals.find(g => g.id === goalId);
    if (!goal) return showToast('Цель не найдена', 'error');
    if (goal.current >= goal.target) return showToast(`Цель "${goal.name}" уже достигнута`, 'error');
    data.toGoalId = goalId;
  }

  const result = await apiRequest('/transactions', 'POST', data);
  if (result?.success) {
    await refreshUserData();
    document.getElementById('modalIncome').classList.add('hidden');
    showToast('Доход добавлен ✅', 'success');
  } else {
    showToast(result?.message || 'Ошибка', 'error');
  }
}