const mysql = require('mysql2/promise');
const config = require('./index');

const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: config.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  // Fail a request promptly when MySQL is unreachable instead of leaving the
  // admin-login request pending until the driver-level timeout expires.
  connectTimeout: 10_000,
  dateStrings: false,
});

module.exports = pool;
