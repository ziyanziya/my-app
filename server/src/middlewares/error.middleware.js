module.exports = function errorMiddleware(err, req, res, next) { // eslint-disable-line
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal Server Error';
  const details = err.details || null;

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(status).json({ success: false, error: { code, message, details } });
};
