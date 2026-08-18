module.exports = function errorMiddleware(err, req, res, next) { // eslint-disable-line
  const databaseUnavailable = ['ETIMEDOUT', 'ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR'].includes(err.code);
  const status = databaseUnavailable ? 503 : (err.status || 500);
  const code = databaseUnavailable ? 'DATABASE_UNAVAILABLE' : (err.code || 'INTERNAL_ERROR');
  const message = databaseUnavailable
    ? 'Database connection is temporarily unavailable. Please try again shortly.'
    : (err.message || 'Internal Server Error');
  const details = err.details || null;

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(status).json({ success: false, error: { code, message, details } });
};
