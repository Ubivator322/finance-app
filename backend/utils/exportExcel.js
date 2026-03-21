const XLSX = require('xlsx');

// Серверный экспорт в Excel (вызывается из userController или отдельного роута)
const exportToExcel = (transactions, userName = 'user') => {
  if (!transactions || transactions.length === 0) {
    throw new Error('Нет данных для экспорта');
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

  const fileName = `финансы_${userName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  
  XLSX.writeFile(wb, fileName);   // файл сохраняется в папку с сервером
  return fileName;
};

module.exports = { exportToExcel };