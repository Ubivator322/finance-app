// ====================== CORE.JS — ПОЛНАЯ ВЕРСИЯ С ПЕРЕКЛЮЧЕНИЕМ РЕЖИМОВ И АВТООПРЕДЕЛЕНИЕМ ТЕЛЕФОНА ======================
let currentUser = null;
let categoryChart = null;
let incomeExpenseChart = null;
let categoryPieChart = null;
let topExpenseChart = null;
let currentPeriod = 6;
let currentTopUpGoalId = null;
let currentSpendGoalId = null;

const API_BASE = 'https://finance-app-2-0.onrender.com/api';

async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const config = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(API_BASE + endpoint, config);
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return null;
    }
    return await res.json();
  } catch (err) {
    showToast(err.message || 'Ошибка соединения', 'error');
    return null;
  }
}

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

function updateSidebarAvatar() {
  const el = document.getElementById('sidebarAvatar');
  if (!el || !currentUser) return;
  
  const isDark = document.documentElement.classList.contains('dark');
  
  if (currentUser.avatar && currentUser.avatar.startsWith('data:image')) {
    el.innerHTML = `<img src="${currentUser.avatar}" class="w-full h-full object-cover rounded-2xl">`;
  } else {
    el.innerHTML = `<span class="text-3xl">${currentUser.avatar || '👤'}</span>`;
  }
  
  el.style.backgroundColor = isDark ? '#27272a' : '#f4f4f5';
}

// ========== ПЕРЕКЛЮЧЕНИЕ МЕЖДУ ПК И МОБИЛЬНЫМ РЕЖИМОМ ==========
function setLayout(mode) {
  const body = document.body;
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggleBtn = document.getElementById('layoutToggle');

  if (!body) return;

  if (mode === 'mobile') {
    body.classList.add('mobile-layout');
    localStorage.setItem('layout', 'mobile');
    if (toggleBtn) toggleBtn.textContent = '💻';
    if (sidebar) {
      sidebar.classList.remove('sidebar-open');
      sidebar.style.transform = '';
    }
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('overlay-visible');
    }
  } else {
    body.classList.remove('mobile-layout');
    localStorage.setItem('layout', 'pc');
    if (toggleBtn) toggleBtn.textContent = '📱';
    if (sidebar) {
      sidebar.classList.remove('-translate-x-full', 'sidebar-open');
      sidebar.style.transform = '';
    }
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('overlay-visible');
    }
  }
}

function toggleLayout() {
  const isMobile = document.body.classList.contains('mobile-layout');
  setLayout(isMobile ? 'pc' : 'mobile');
}

// ====================== ЗАПУСК ======================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Загружаем данные пользователя
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
      updateSidebarAvatar();
    });
  }

  // 3. Инициализация режима (ПК / мобильный) – автоматически + ручное сохранение
  const isMobileByWidth = window.innerWidth <= 768;
  const savedLayout = localStorage.getItem('layout');

  if (isMobileByWidth) {
    // На телефоне всегда включаем мобильный режим, но сохраняем выбор пользователя, если он переключил вручную
    if (savedLayout === 'pc') {
      setLayout('pc'); // если пользователь явно выбрал ПК на телефоне, уважаем его выбор
    } else {
      setLayout('mobile');
    }
  } else {
    if (savedLayout === 'mobile') {
      setLayout('mobile');
    } else {
      setLayout('pc');
    }
  }

  // 4. Кнопка переключения режима
  const layoutToggle = document.getElementById('layoutToggle');
  if (layoutToggle) {
    layoutToggle.removeEventListener('click', toggleLayout);
    layoutToggle.addEventListener('click', toggleLayout);
  }

  // 5. Кнопки "Расход" / "Доход"
  document.getElementById('addExpenseBtn').addEventListener('click', () => {
    if (typeof window.showExpenseModal === 'function') window.showExpenseModal();
  });
  document.getElementById('addIncomeBtn').addEventListener('click', () => {
    if (typeof window.showIncomeModal === 'function') window.showIncomeModal();
  });

  // 6. Навигация по табам
  document.querySelectorAll('.tab-nav').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-nav').forEach(b => b.classList.remove('active', 'bg-zinc-100', 'dark:bg-zinc-800'));
      btn.classList.add('active', 'bg-zinc-100', 'dark:bg-zinc-800');

      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      const tabId = btn.dataset.tab + 'Tab';
      const tabElement = document.getElementById(tabId);
      if (tabElement) tabElement.classList.add('active');

      document.getElementById('pageTitle').textContent = btn.textContent.trim();

      if (btn.dataset.tab === 'analytics') renderAnalytics();
      if (btn.dataset.tab === 'goals') renderGoals();
      if (btn.dataset.tab === 'budget') {
        if (typeof window.renderBudgets === 'function') {
          window.renderBudgets();
        } else {
          console.error('renderBudgets не найден');
        }
      }
    });
  });

  // 7. Кнопка "Добавить цель"
  const addGoalBtn = document.getElementById('addGoalBtn');
  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      if (typeof window.showGoalModal === 'function') {
        window.showGoalModal();
      } else {
        console.error('showGoalModal не найдена');
      }
    });
  }

  // 8. Выход
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // 9. Первичный рендер
  renderOverview();
});

function logout() {
  showConfirm("Выйти из аккаунта?", "Вы действительно хотите выйти?", () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });
}

async function refreshUserData() {
  await loadUserData();
  renderOverview();
  if (document.getElementById('analyticsTab').classList.contains('active')) renderAnalytics();
  if (document.getElementById('goalsTab').classList.contains('active')) renderGoals();
}

window.apiRequest = apiRequest;
window.refreshUserData = refreshUserData;