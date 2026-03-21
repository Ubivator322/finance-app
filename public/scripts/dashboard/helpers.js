
function getRealTransactions(trans) {
  return trans.filter(t => 
    !t.fromBalanceToGoal && 
    !t.isRefund && 
    !t.isGoalReturn && 
    !t.toGoalId && 
    !t.fromGoalId
  );
}

function filterTransactionsByPeriod(trans) {
  if (currentPeriod === 0) return trans;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - currentPeriod);
  return trans.filter(t => new Date(t.date) >= cutoff);
}

function getUniqueMonths(trans) {
  const set = new Set(trans.map(t => t.date.slice(0, 7)));
  return set.size || 1;
}

function getMonthlyData(trans) {
  const months = {};
  trans.forEach(t => {
    const key = t.date.slice(0, 7);
    if (!months[key]) months[key] = { income: 0, expense: 0 };
    if (t.amount > 0) months[key].income += t.amount;
    else months[key].expense += Math.abs(t.amount);
  });
  const labels = Object.keys(months).sort();
  return { labels, income: labels.map(m => months[m].income), expense: labels.map(m => months[m].expense) };
}

function showConfirm(title, text, onConfirm) {
  const modal = document.getElementById('modalConfirm');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  modal.classList.remove('hidden');

  const cancelBtn = document.getElementById('confirmCancel');
  const okBtn = document.getElementById('confirmOk');

  // Очищаем старые обработчики
  cancelBtn.onclick = () => modal.classList.add('hidden');
  okBtn.onclick = () => {
    modal.classList.add('hidden');
    onConfirm();
  };
}