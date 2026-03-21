const errorHandler = (err, req, res, next) => {
  console.error('🚨 Ошибка сервера:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  res.status(statusCode).json({
    success: false,
    message,
    // В продакшене скрываем детали ошибки
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;