// ====================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ======================
let currentUser = null;
let categoryChart = null;
let incomeExpenseChart = null;
let categoryPieChart = null;
let topExpenseChart = null;
let currentPeriod = 6;
let currentTopUpGoalId = null;
let currentSpendGoalId = null;

// ====================== API ======================
const API_BASE = 'https://finance-app-2-0.onrender.com/api';   // ← твоя ссылка с Render!

async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const config = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(API_BASE + endpoint, config);
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return null;
    }
    if (!res.ok) throw new Error((await res.json()).message || 'Ошибка');
    return await res.json();
  } catch (err) {
    showToast(err.message || 'Ошибка соединения', 'error');
    return null;
  }
}

// ====================== ЗАГРУЗКА ДАННЫХ ======================
async function loadUserData() {
  const result = await apiRequest('/user');
  if (!result?.success) {
    window.location.href = 'index.html';
    return false;
  }
  currentUser = result.user;
  document.getElementById('userName').textContent = currentUser.name || 'Пользователь';
  updateSidebarAvatar();
  return true;
}

// ====================== ЗАПУСК ======================
document.addEventListener('DOMContentLoaded', async () => {
  if (!(await loadUserData())) return;

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

  // Табы + кнопки
  document.querySelectorAll('.tab-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-nav').forEach(b => b.classList.remove('active', 'bg-zinc-100', 'dark:bg-zinc-800'));
      btn.classList.add('active', 'bg-zinc-100', 'dark:bg-zinc-800');
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
      document.getElementById('pageTitle').textContent = btn.textContent.trim();

      if (btn.dataset.tab === 'analytics') renderAnalytics();
      if (btn.dataset.tab === 'goals') renderGoals();
    });
  });

  document.getElementById('addExpenseBtn').addEventListener('click', showExpenseModal);
  document.getElementById('addIncomeBtn').addEventListener('click', showIncomeModal);
  document.getElementById('addGoalBtn').addEventListener('click', showGoalModal);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => setPeriod(parseInt(btn.dataset.period)));
  });

  // Первый рендер
  renderOverview();
});

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

function updateSidebarAvatar() {
  const el = document.getElementById('sidebarAvatar');
  if (!el) return;
  if (currentUser.avatar?.startsWith('data:image')) {
    el.innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full object-cover rounded-2xl">`;
  } else {
    el.innerHTML = `<span class="text-3xl">${currentUser.avatar || '👤'}</span>`;
  }
}

async function refreshUserData() {
  await loadUserData();
  renderOverview();
  if (document.getElementById('analyticsTab').classList.contains('active')) renderAnalytics();
  if (document.getElementById('goalsTab').classList.contains('active')) renderGoals();
}

window.apiRequest = apiRequest;
window.refreshUserData = refreshUserData;