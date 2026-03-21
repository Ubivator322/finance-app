// ====================== AUTH.JS — ЛОКАЛЬНАЯ ВЕРСИЯ ======================
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast flex items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl text-white font-medium ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-xmark-circle'} text-xl"></i>
    <span>${msg}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ====================== ЗАГРУЗКА ======================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('regName').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPassword').value = '';
  switchToLogin();
});

// ====================== ПЕРЕКЛЮЧЕНИЕ ТАБОВ ======================
function switchToLogin() {
  document.getElementById('tabLogin').classList.add('active', 'bg-white', 'text-indigo-700');
  document.getElementById('tabRegister').classList.remove('active', 'bg-white', 'text-indigo-700');
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
}

function switchToRegister() {
  document.getElementById('tabRegister').classList.add('active', 'bg-white', 'text-indigo-700');
  document.getElementById('tabLogin').classList.remove('active', 'bg-white', 'text-indigo-700');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginForm').classList.add('hidden');
}

document.getElementById('tabLogin').onclick = switchToLogin;
document.getElementById('tabRegister').onclick = switchToRegister;

// ====================== ПОКАЗ/СКРЫТИЕ ПАРОЛЯ ======================
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const eye = document.getElementById(fieldId === 'loginPassword' ? 'loginEye' : 'regEye');
  if (field.type === 'password') {
    field.type = 'text';
    eye.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    field.type = 'password';
    eye.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// ====================== РЕГИСТРАЦИЯ ======================
document.getElementById('registerForm').onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;

  if (password.length < 6) return showToast('Пароль минимум 6 символов', 'error');

  let users = JSON.parse(localStorage.getItem('users') || '[]');
  if (users.some(u => u.email === email)) {
    return showToast('Пользователь с таким email уже существует', 'error');
  }

  const newUser = {
    email,
    name,
    password, // В реальном приложении нужно хэшировать, но для простоты оставим как есть
    avatar: '👤',
    data: {
      transactions: [],
      goals: [],
      expenseCategories: ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Одежда', 'Здоровье', 'Красота', 'Связь', 'Другое'],
      incomeCategories: ['Зарплата', 'Фриланс', 'Инвестиции', 'Подарки', 'Пенсия', 'Возврат долга', 'Другие доходы']
    }
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('token', email);

  showToast('Аккаунт создан! Входим...', 'success');
  setTimeout(() => window.location.href = 'dashboard.html', 800);
};

// ====================== ВХОД ======================
document.getElementById('loginForm').onsubmit = (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem('token', email);
    showToast('Вход выполнен успешно!', 'success');
    setTimeout(() => window.location.href = 'dashboard.html', 800);
  } else {
    showToast('Неверный email или пароль', 'error');
  }
};