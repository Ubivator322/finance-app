// ====================== GOALS.JS — ИСПРАВЛЕНО (без дублирования денег) ======================

async function renderGoals() {
  const list = document.getElementById('goalsList');
  const goals = currentUser.data.goals || [];
  if (goals.length === 0) {
    list.innerHTML = `<p class="text-zinc-500 text-center py-12">Пока нет целей. Создайте первую!</p>`;
    return;
  }
  list.innerHTML = goals.map(g => {
    const percent = g.target > 0 ? Math.min(Math.round((g.current / g.target) * 100), 100) : 0;
    return `
      <div class="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 relative">
        <button onclick="deleteGoal(${g.id})" class="absolute top-5 right-5 text-zinc-400 hover:text-red-500 text-xl"><i class="fas fa-trash"></i></button>
        <div class="flex justify-between items-start mb-4">
          <div><h4 class="font-semibold text-xl">${g.name}</h4>${g.deadline ? `<p class="text-sm text-zinc-500">до ${g.deadline}</p>` : ''}</div>
        </div>
        <div class="flex justify-between text-sm mb-2"><span class="text-zinc-500">Накоплено</span><span class="font-medium">${g.current.toLocaleString('ru-RU')} ₽</span></div>
        <div class="flex justify-between text-sm mb-3"><span class="text-zinc-500">Цель</span><span class="font-medium">${g.target.toLocaleString('ru-RU')} ₽</span></div>
        <div class="bg-zinc-200 dark:bg-zinc-800 rounded-full h-3 mb-6"><div class="bg-violet-600 h-3 rounded-full transition-all" style="width: ${percent}%"></div></div>
        <div class="grid grid-cols-2 gap-3">
          <button onclick="topUpFromBalance(${g.id})" class="py-3.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-3xl">Пополнить из баланса</button>
          <button onclick="spendFromGoal(${g.id})" class="py-3.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-3xl">Списать на баланс</button>
        </div>
      </div>
    `;
  }).join('');
}

window.topUpFromBalance = function(goalId) {
  const goal = currentUser.data.goals.find(g => g.id === goalId);
  if (!goal) return;
  currentTopUpGoalId = goalId;
  const remaining = goal.target - goal.current;
  document.getElementById('topUpGoalName').textContent = `Цель: ${goal.name} (осталось ${remaining.toLocaleString('ru-RU')} ₽)`;
  document.getElementById('topUpAmount').value = '';
  document.getElementById('modalTopUpFromBalance').classList.remove('hidden');
};

window.confirmTopUpFromBalance = async function() {
  let requested = parseFloat(document.getElementById('topUpAmount').value);
  if (!requested || requested <= 0) return showToast('Введите сумму', 'error');

  const goal = currentUser.data.goals.find(g => g.id === currentTopUpGoalId);
  const remaining = goal.target - goal.current;
  const freeBalance = currentUser.data.transactions.reduce((sum, t) => sum + t.amount, 0);

  if (requested > freeBalance) return showToast('На балансе недостаточно средств!', 'error');

  // СПИСЫВАЕМ ТОЛЬКО ТО, ЧТО МОЖНО ПОЛОЖИТЬ
  const actualAmount = Math.min(requested, remaining);

  const result = await apiRequest('/transactions', 'POST', {
    date: new Date().toISOString().slice(0, 10),
    category: 'Пополнение цели',
    amount: -actualAmount,
    desc: `Пополнение "${goal.name}"`,
    toGoalId: goal.id
  });

  if (result?.success) {
    await refreshUserData();
    closeTopUpModal();
    if (actualAmount < requested) {
      showToast(`Пополнено ${actualAmount.toLocaleString('ru-RU')} ₽ (излишек ${ (requested - actualAmount).toLocaleString('ru-RU') } ₽ не списан)`, 'success');
    } else {
      showToast(`✅ ${actualAmount.toLocaleString('ru-RU')} ₽ зачислено на цель`, 'success');
    }
  } else {
    showToast(result?.message || 'Ошибка пополнения', 'error');
  }
};

window.spendFromGoal = function(goalId) {
  const goal = currentUser.data.goals.find(g => g.id === goalId);
  if (!goal || goal.current <= 0) return showToast('На цели нет средств', 'error');
  currentSpendGoalId = goalId;
  document.getElementById('spendGoalName').textContent = `Цель: ${goal.name}`;
  document.getElementById('spendAmount').value = '';
  document.getElementById('modalSpendFromGoal').classList.remove('hidden');
};

window.confirmSpendFromGoal = async function() {
  let amount = parseFloat(document.getElementById('spendAmount').value);
  const goal = currentUser.data.goals.find(g => g.id === currentSpendGoalId);
  if (amount > goal.current) return showToast('Недостаточно на цели!', 'error');

  const result = await apiRequest('/transactions', 'POST', {
    date: new Date().toISOString().slice(0, 10),
    category: 'Списание с цели',
    amount: amount,
    desc: `Списание с "${goal.name}"`,
    fromGoalId: goal.id
  });

  if (result?.success) {
    await refreshUserData();
    closeSpendModal();
    showToast(`✅ ${amount.toLocaleString('ru-RU')} ₽ переведено на баланс`, 'success');
  } else {
    showToast(result?.message || 'Ошибка списания', 'error');
  }
};

window.deleteGoal = async function(id) {
  showConfirm("Удалить цель?", "Все средства вернутся на баланс.<br>Действие нельзя отменить.", async () => {
    const result = await apiRequest(`/goals/${id}`, 'DELETE');
    if (result?.success) {
      await refreshUserData();
      showToast('Цель удалена, средства возвращены ✅', 'success');
    } else {
      showToast(result?.message || 'Ошибка', 'error');
    }
  });
};

window.closeTopUpModal = () => document.getElementById('modalTopUpFromBalance').classList.add('hidden');
window.closeSpendModal = () => document.getElementById('modalSpendFromGoal').classList.add('hidden');