const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Missing authorization header');
    err.status = 401;
    err.code = 'UNAUTHORIZED';
    return next(err);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    const err = new Error('Invalid or expired token');
    err.status = 401;
    err.code = 'INVALID_TOKEN';
    return next(err);
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error('Unauthorized');
      err.status = 401;
      return next(err);
    }
    if (req.user.role !== role) {
      const err = new Error('Forbidden');
      err.status = 403;
      err.code = 'FORBIDDEN';
      return next(err);
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
