// ====================== CORE.JS — ФИНАЛЬНАЯ ВЕРСИЯ С АВТООПРЕДЕЛЕНИЕМ ТЕЛЕФОНА ======================
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
    if (sidebar) sidebar.classList.remove('sidebar-open');
    if (overlay) overlay.classList.add('hidden');
  } else {
    body.classList.remove('mobile-layout');
    localStorage.setItem('layout', 'pc');
    if (toggleBtn) toggleBtn.textContent = '📱';
    if (sidebar) sidebar.classList.remove('-translate-x-full', 'sidebar-open');
    if (overlay) overlay.classList.add('hidden');
  }
}

function toggleLayout() {
  const isMobile = document.body.classList.contains('mobile-layout');
  setLayout(isMobile ? 'pc' : 'mobile');
}

document.addEventListener('DOMContentLoaded', async () => {
  const loaded = await loadUserData();
  if (!loaded) return;
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
      updateSidebarAvatar();
    });
  }
  // Автоопределение мобильного устройства (ширина + userAgent)
  const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobileDevice) {
    setLayout('mobile');
  } else {
    setLayout('pc');
  }
  // Кнопка переключения
  const layoutToggle = document.getElementById('layoutToggle');
  if (layoutToggle) layoutToggle.addEventListener('click', toggleLayout);
  // Кнопки
  document.getElementById('addExpenseBtn').addEventListener('click', () => { if (typeof window.showExpenseModal === 'function') window.showExpenseModal(); });
  document.getElementById('addIncomeBtn').addEventListener('click', () => { if (typeof window.showIncomeModal === 'function') window.showIncomeModal(); });
  // Табы
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
      if (btn.dataset.tab === 'budget') { if (typeof window.renderBudgets === 'function') window.renderBudgets(); }
    });
  });
  // Цели
  const addGoalBtn = document.getElementById('addGoalBtn');
  if (addGoalBtn) addGoalBtn.addEventListener('click', (e) => { e.stopImmediatePropagation(); if (typeof window.showGoalModal === 'function') window.showGoalModal(); });
  // Выход
  document.getElementById('logoutBtn').addEventListener('click', logout);
  // Рендер
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