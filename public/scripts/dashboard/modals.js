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