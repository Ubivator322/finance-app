// ====================== CORE.JS — ИСПРАВЛЕННАЯ ВЕРСИЯ ======================
let currentUser = null;
let categoryChart = null;
let incomeExpenseChart = null;
let categoryPieChart = null;
let topExpenseChart = null;
let currentPeriod = 6;
let currentTopUpGoalId = null;
let currentSpendGoalId = null;

// === СЮДА ВСТАВЬ СВОЮ ССЫЛКУ С RENDER ===
const API_BASE = 'https://finance-app-2-0.onrender.com/api';   // ← ИЗМЕНИ НА СВОЮ!

async function apiRequest(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  
  console.log(`→ Запрос: ${method} ${endpoint}`); // для отладки

  const config = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(API_BASE + endpoint, config);
    
    if (res.status === 401) {
      console.log('❌ Токен недействителен');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      return null;
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Ошибка сервера');
    }

    const data = await res.json();
    console.log('✅ Ответ:', data);
    return data;
  } catch (err) {
    console.error('API Error:', err);
    showToast(err.message || 'Ошибка соединения с сервером', 'error');
    return null;
  }
}

async function loadUserData() {
  const result = await apiRequest('/user');
  
  if (!result || !result.success) {
    console.log('❌ Не удалось загрузить пользователя');
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
  console.log('🚀 Запуск dashboard...');
  const loaded = await loadUserData();
  if (!loaded) return;

  // ... (тема, табы, кнопки — оставляем как было раньше)
  // (я оставил только главное, чтобы не перегружать)

  renderOverview();
});

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

async function refreshUserData() {
  await loadUserData();
  renderOverview();
  if (document.getElementById('analyticsTab').classList.contains('active')) renderAnalytics();
  if (document.getElementById('goalsTab').classList.contains('active')) renderGoals();
}

window.apiRequest = apiRequest;
window.refreshUserData = refreshUserData;