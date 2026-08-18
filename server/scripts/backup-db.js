const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'elsirat_db';
const backupDir = path.resolve(__dirname, '..', process.env.DB_BACKUP_DIR || 'backups');
const retentionDays = Number(process.env.DB_BACKUP_RETENTION_DAYS || 7);

const ensureDirectory = () => {
  fs.mkdirSync(backupDir, { recursive: true });
};

const timestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '_',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
};

const getMysqldumpPath = () => {
  const candidates = process.platform === 'win32'
    ? ['mysqldump.exe', 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe', 'C:/Program Files/MySQL/MySQL Server 5.7/bin/mysqldump.exe']
    : ['mysqldump'];

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch (error) {
      // continue to next candidate
    }
  }

  throw new Error('mysqldump not found. Install MySQL client tools or add the binary to PATH.');
};

const removeOldBackups = () => {
  if (!fs.existsSync(backupDir)) {
    return;
  }

  const files = fs.readdirSync(backupDir)
    .filter((file) => file.toLowerCase().endsWith('.sql'))
    .map((file) => ({
      file,
      fullPath: path.join(backupDir, file),
      time: fs.statSync(path.join(backupDir, file)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time);

  const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

  for (const item of files) {
    if (item.time < cutoff) {
      fs.unlinkSync(item.fullPath);
      console.log(`Deleted old backup: ${item.file}`);
    }
  }
};

try {
  ensureDirectory();

  const dumpPath = getMysqldumpPath();
  const fileName = `${dbName}_${timestamp()}.sql`;
  const outputFile = path.join(backupDir, fileName);

  const args = [
    `--host=${dbHost}`,
    `--user=${dbUser}`,
    `--password=${dbPassword}`,
    '--default-character-set=utf8mb4',
    '--routines',
    '--events',
    '--single-transaction',
    '--result-file=' + outputFile,
    dbName,
  ];

  console.log(`Creating backup for database: ${dbName}`);
  console.log(`Backup file: ${outputFile}`);

  execFileSync(dumpPath, args, { stdio: 'inherit' });

  removeOldBackups();

  console.log('Backup completed successfully.');
} catch (error) {
  console.error('Database backup failed:');
  console.error(error.message);
  process.exit(1);
}
