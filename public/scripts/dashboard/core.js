// ====================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ======================
let currentUser = null;
let categoryChart = null;
let incomeExpenseChart = null;
let categoryPieChart = null;
let topExpenseChart = null;
let currentPeriod = 6;
let currentTopUpGoalId = null;
let currentSpendGoalId = null;

// ====================== API КОНФИГУРАЦИЯ ======================
const API_BASE = 'http://localhost:3000/api';

async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  
  if (!token && !endpoint.startsWith('/auth')) {
    window.location.href = 'index.html';
    return null;
  }

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(API_BASE + endpoint, config);

    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return null;
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Ошибка сервера');
    }

    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    showToast(err.message || 'Ошибка соединения с сервером', 'error');
    return null;
  }
}

// ====================== ЗАГРУЗКА ДАННЫХ С СЕРВЕРА ======================
async function loadUserData() {
  try {
    const response = await apiRequest('/user');
    if (!response || !response.user) throw new Error('Не удалось загрузить данные');

    currentUser = response.user;

    // Обновляем интерфейс
    document.getElementById('userName').textContent = currentUser.name || 'Пользователь';
    updateSidebarAvatar();

    return true;
  } catch (e) {
    console.error(e);
    window.location.href = 'index.html';
    return false;
  }
}

// ====================== ЗАПУСК ПРИЛОЖЕНИЯ ======================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Загружаем данные с бэкенда
  const loaded = await loadUserData();
  if (!loaded) return;

  // 2. Тема
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

  // 3. Табы
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

  // 4. Кнопки действий
  document.getElementById('addExpenseBtn').addEventListener('click', showExpenseModal);
  document.getElementById('addIncomeBtn').addEventListener('click', showIncomeModal);
  document.getElementById('addGoalBtn').addEventListener('click', showGoalModal);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // 5. Периоды аналитики
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => setPeriod(parseInt(btn.dataset.period)));
  });

  // 6. Закрытие модалок по клику на фон
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
  showConfirm("Выйти из аккаунта?", "Вы действительно хотите выйти?", async () => {
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
async function refreshUserData() {
  const success = await loadUserData();
  if (success) {
    renderOverview();
    if (document.getElementById('analyticsTab').classList.contains('active')) renderAnalytics();
    if (document.getElementById('goalsTab').classList.contains('active')) renderGoals();
  }
}

// Экспортируем нужные функции в глобальную область
window.apiRequest = apiRequest;
window.refreshUserData = refreshUserData;