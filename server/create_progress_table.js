const db = require('./src/config/db');
db.query(`
CREATE TABLE IF NOT EXISTS user_practical_progress (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  worship_id BIGINT UNSIGNED NOT NULL,
  step_id BIGINT UNSIGNED NOT NULL,
  completed TINYINT(1) DEFAULT 0,
  completed_at DATETIME(3),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY (user_id, step_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (worship_id) REFERENCES worships(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES practical_steps(id) ON DELETE CASCADE
);
`).then(() => {
  console.log('Table user_practical_progress created!');
  process.exit(0);
}).catch(console.error);
