// ====================== PROFILE.JS — НОВАЯ ВЕРСИЯ ДЛЯ БЭКЕНДА ======================

function showProfileModal() {
  const modal = document.getElementById('modalProfile');
  modal.classList.remove('hidden');
  document.getElementById('profileName').textContent = currentUser.name || 'Пользователь';
  document.getElementById('profileEmail').textContent = currentUser.email || '—';
  updateAvatar();
}

function closeProfileModal() {
  document.getElementById('modalProfile').classList.add('hidden');
}

function openEditNameModal() {
  closeProfileModal();
  document.getElementById('modalEditName').classList.remove('hidden');
  document.getElementById('editNameInput').value = currentUser.name || '';
}

async function saveNewName() {
  const newName = document.getElementById('editNameInput').value.trim();
  if (!newName) return showToast('Введите имя', 'error');

  const result = await apiRequest('/user', 'PUT', { name: newName });

  if (result.success) {
    await refreshUserData();
    closeEditNameModal();
    showToast('Имя изменено!', 'success');
  }
}

function openAvatarModal() {
  closeProfileModal();
  const modal = document.getElementById('modalAvatar');
  modal.classList.remove('hidden');
  const emojis = ['👤','🧔','👨‍💼','👩‍💼','🧑‍🚀','👨‍🚀','🦸','🧙','🧑‍🔬','👨‍🍳','🧑‍💻','🦁','🐼','🐺','🐯','🦊'];
  const grid = document.getElementById('emojiGrid');
  grid.innerHTML = '';
  emojis.forEach(emoji => {
    const div = document.createElement('div');
    div.className = 'text-5xl cursor-pointer hover:scale-125 transition-transform';
    div.textContent = emoji;
    div.onclick = async () => {
      await apiRequest('/user', 'PUT', { avatar: emoji });
      await refreshUserData();
      closeAvatarModal();
    };
    grid.appendChild(div);
  });
}

async function uploadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    await apiRequest('/user', 'PUT', { avatar: ev.target.result });
    await refreshUserData();
    closeAvatarModal();
  };
  reader.readAsDataURL(file);
}

function updateAvatar() {
  const el = document.getElementById('profileAvatar');
  if (!el) return;
  el.innerHTML = currentUser.avatar || '👤';
}

// ====================== ОЧИСТКА И ЭКСПОРТ ======================
async function clearExpenses() {
  showConfirm("Очистить все расходы?", "Все расходные операции будут удалены безвозвратно.", async () => {
    await apiRequest('/user/clear-expenses', 'DELETE');
    await refreshUserData();
    showToast('Расходы очищены', 'success');
  });
}

async function clearIncomes() {
  showConfirm("Очистить все доходы?", "Все доходные операции будут удалены безвозвратно.", async () => {
    await apiRequest('/user/clear-incomes', 'DELETE');
    await refreshUserData();
    showToast('Доходы очищены', 'success');
  });
}

async function clearAll() {
  showConfirm("Очистить ВСЮ историю?", "Все транзакции и цели будут удалены безвозвратно.", async () => {
    await apiRequest('/user/clear-all', 'DELETE');
    await refreshUserData();
    showToast('История очищена', 'success');
  });
}

function exportExcel() {
  window.exportToExcel(currentUser.data.transactions, currentUser.name || 'user');
}

// ====================== ЗАКРЫТИЕ МОДАЛОК ======================
function closeEditNameModal() {
  document.getElementById('modalEditName').classList.add('hidden');
  showProfileModal();
}

function closeAvatarModal() {
  document.getElementById('modalAvatar').classList.add('hidden');
  showProfileModal();
}

function closeAllModals() {
  document.getElementById('modalProfile').classList.add('hidden');
  document.getElementById('modalEditName').classList.add('hidden');
  document.getElementById('modalAvatar').classList.add('hidden');
}