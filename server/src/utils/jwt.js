const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

function signAccess(payload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
}

function signRefresh(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    jwtid: uuidv4(),
  });
}

function verify(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

module.exports = { signAccess, signRefresh, verify };
