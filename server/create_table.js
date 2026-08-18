const db = require('./src/config/db');
db.query(`
CREATE TABLE IF NOT EXISTS practical_step_media (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  practical_step_id BIGINT UNSIGNED NOT NULL,
  media_type VARCHAR(50) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  file_size INT,
  title VARCHAR(255),
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (practical_step_id) REFERENCES practical_steps(id) ON DELETE CASCADE
);
`).then(() => {
  console.log('Table created!');
  process.exit(0);
}).catch(console.error);
