function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) {
    console.warn('toastContainer не найден');
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast flex items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl text-white font-medium ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
    }`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-xmark-circle'} text-xl"></i>
    <span>${msg}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

// Сохранить текущего пользователя в localStorage
function saveUser(currentUser) {
  if (!currentUser || !currentUser.email) return;

  let users = JSON.parse(localStorage.getItem('users') || '[]');
  const idx = users.findIndex(u => u.email === currentUser.email);

  if (idx !== -1) {
    users[idx] = currentUser;
  } else {
    users.push(currentUser);
  }

  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// Форматирование суммы в рублях
function formatAmount(amount) {
  return Math.abs(amount).toLocaleString('ru-RU') + ' ₽';
}

// Получить ключ текущего месяца (YYYY-MM)
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Экспорт в Excel (только выгрузка)
function exportToExcel(transactions, userName = 'user') {
  if (!transactions || transactions.length === 0) {
    showToast('Нет данных для экспорта', 'error');
    return;
  }

  const data = transactions.map(t => ({
    Дата: t.date,
    Тип: t.amount < 0 ? 'Расход' : 'Доход',
    Категория: t.category,
    Сумма: Math.abs(t.amount),
    Описание: t.desc || ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Операции");
  XLSX.writeFile(wb, `финансы_${userName}_${new Date().toISOString().slice(0, 10)}.xlsx`);

  showToast('✅ Excel успешно выгружен!', 'success');
}

// Хэширование пароля (SHA-256) — используется в auth.js
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Глобально доступные функции
window.showToast = showToast;
window.saveUser = saveUser;
window.formatAmount = formatAmount;
window.getCurrentMonth = getCurrentMonth;
window.exportToExcel = exportToExcel;
window.hashPassword = hashPassword;