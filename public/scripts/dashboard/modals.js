async function saveExpense() {
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const category = document.getElementById('expenseCategory').value;
  const date = document.getElementById('expenseDate').value || new Date().toISOString().slice(0, 10);
  const desc = document.getElementById('expenseDesc').value.trim();
  const fromGoalIdRaw = document.getElementById('expenseFromGoal').value;

  if (!amount || amount <= 0 || !category) {
    return showToast('Заполните сумму и категорию', 'error');
  }

  // Подготовка данных без цели
  const data = {
    date,
    category,
    amount: -amount,
    desc: desc || 'Расход'
  };

  // Если выбран ID цели и он не пустой
  if (fromGoalIdRaw && fromGoalIdRaw !== '') {
    const goalId = parseInt(fromGoalIdRaw, 10);
    // Ищем цель в загруженных данных пользователя
    const goal = currentUser.data.goals.find(g => g.id === goalId);
    if (!goal) {
      return showToast('Выбранная цель не найдена', 'error');
    }
    if (goal.current < amount) {
      return showToast(`Недостаточно средств на цели "${goal.name}"`, 'error');
    }
    data.fromGoalId = goalId;
  }

  const result = await apiRequest('/transactions', 'POST', data);
  
  if (result && result.success) {
    await refreshUserData();
    document.getElementById('modalExpense').classList.add('hidden');
    showToast('Расход успешно добавлен', 'success');
  } else {
    showToast(result?.message || 'Ошибка добавления расхода', 'error');
  }
}

async function saveIncome() {
  const amount = parseFloat(document.getElementById('incomeAmount').value);
  const category = document.getElementById('incomeCategory').value;
  const date = document.getElementById('incomeDate').value || new Date().toISOString().slice(0, 10);
  const desc = document.getElementById('incomeDesc').value.trim();
  const toGoalIdRaw = document.getElementById('incomeToGoal').value;

  if (!amount || amount <= 0 || !category) {
    return showToast('Заполните сумму и категорию', 'error');
  }

  const data = {
    date,
    category,
    amount: amount,
    desc: desc || 'Доход'
  };

  if (toGoalIdRaw && toGoalIdRaw !== '') {
    const goalId = parseInt(toGoalIdRaw, 10);
    const goal = currentUser.data.goals.find(g => g.id === goalId);
    if (!goal) {
      return showToast('Выбранная цель не найдена', 'error');
    }
    if (goal.current >= goal.target) {
      return showToast(`Цель "${goal.name}" уже достигнута`, 'error');
    }
    data.toGoalId = goalId;
  }

  const result = await apiRequest('/transactions', 'POST', data);

  if (result && result.success) {
    await refreshUserData();
    document.getElementById('modalIncome').classList.add('hidden');
    showToast('Доход успешно добавлен', 'success');
  } else {
    showToast(result?.message || 'Ошибка добавления дохода', 'error');
  }
}

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