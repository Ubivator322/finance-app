// ====================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ======================
let currentUser = null;
let categoryChart = null;
let incomeExpenseChart = null;
let categoryPieChart = null;
let topExpenseChart = null;
let currentPeriod = 6;
let currentTopUpGoalId = null;
let currentSpendGoalId = null;

// ====================== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЯ ИЗ LOCALSTORAGE ======================
function loadUserFromStorage() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }

  // Ищем пользователя по email из токена (в старом подходе токен = email)
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const found = users.find(u => u.email === token);
  if (!found) {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
    return false;
  }

  currentUser = found;
  // Убедимся, что структура data есть
  if (!currentUser.data) {
    currentUser.data = {
      transactions: [],
      goals: [],
      expenseCategories: ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Одежда', 'Здоровье', 'Красота', 'Связь', 'Другое'],
      incomeCategories: ['Зарплата', 'Фриланс', 'Инвестиции', 'Подарки', 'Пенсия', 'Возврат долга', 'Другие доходы']
    };
  }

  document.getElementById('userName').textContent = currentUser.name || 'Пользователь';
  updateSidebarAvatar();
  return true;
}

// ====================== ЗАПУСК ПРИЛОЖЕНИЯ ======================
document.addEventListener('DOMContentLoaded', () => {
  // Загружаем пользователя
  if (!loadUserFromStorage()) return;

  // Тема
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeToggle.textContent = isDark ? '☀️' : '🌙';
    });
  }

  // Табы
  document.querySelectorAll('.tab-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-nav').forEach(b => b.classList.remove('active', 'bg-zinc-100', 'dark:bg-zinc-800'));
      btn.classList.add('active', 'bg-zinc-100', 'dark:bg-zinc-800');

      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
      document.getElementById('pageTitle').textContent = btn.textContent.trim();

      if (btn.dataset.tab === 'analytics') renderAnalytics();
      if (btn.dataset.tab === 'goals') renderGoals();
    });
  });

  // Кнопки действий
  document.getElementById('addExpenseBtn').addEventListener('click', showExpenseModal);
  document.getElementById('addIncomeBtn').addEventListener('click', showIncomeModal);
  document.getElementById('addGoalBtn').addEventListener('click', showGoalModal);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Периоды аналитики
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => setPeriod(parseInt(btn.dataset.period)));
  });

  // Закрытие модалок по клику на фон
  document.querySelectorAll('#modalIncome, #modalExpense, #modalGoal, #modalTopUpFromBalance, #modalSpendFromGoal, #modalProfile, #modalEditName, #modalAvatar, #modalConfirm').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });

  // Первый рендер
  renderOverview();
});

// ====================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======================
function logout() {
  showConfirm("Выйти из аккаунта?", "Вы действительно хотите выйти?", () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
}

function updateSidebarAvatar() {
  const el = document.getElementById('sidebarAvatar');
  if (!el || !currentUser) return;

  if (currentUser.avatar && currentUser.avatar.startsWith('data:image')) {
    el.innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full object-cover rounded-2xl">`;
  } else {
    el.innerHTML = `<span class="text-3xl">${currentUser.avatar || '👤'}</span>`;
  }
}

// ====================== ОБНОВЛЕНИЕ ДАННЫХ ПОСЛЕ ИЗМЕНЕНИЙ ======================
function refreshUserData() {
  // Перезагружаем пользователя из localStorage (т.к. saveUser уже сохранил)
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const found = users.find(u => u.email === currentUser.email);
  if (found) currentUser = found;

  renderOverview();
  if (document.getElementById('analyticsTab').classList.contains('active')) renderAnalytics();
  if (document.getElementById('goalsTab').classList.contains('active')) renderGoals();
}

// Экспортируем для использования в других скриптах
window.refreshUserData = refreshUserData;