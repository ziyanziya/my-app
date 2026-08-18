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

const getMysqlPath = () => {
  const candidates = process.platform === 'win32'
    ? ['mysql.exe', 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe', 'C:/Program Files/MySQL/MySQL Server 5.7/bin/mysql.exe']
    : ['mysql'];

  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch (error) {
      // continue
    }
  }

  throw new Error('mysql client not found. Install MySQL client tools or add mysql to PATH.');
};

const fileArg = process.argv[2];

if (!fileArg) {
  const files = fs.existsSync(backupDir)
    ? fs.readdirSync(backupDir).filter((file) => file.toLowerCase().endsWith('.sql')).sort()
    : [];

  if (files.length === 0) {
    console.error('No backup files found. Add the backup file name, for example:');
    console.error('npm run restore-db -- backups/elsirat_db_20260816_120000.sql');
    process.exit(1);
  }

  console.log('Available backups:');
  files.forEach((file) => console.log(`- ${path.join('backups', file)}`));
  console.log('\nUse: npm run restore-db -- backups/FILE_NAME.sql');
  process.exit(0);
}

const backupFile = path.resolve(process.cwd(), fileArg);

if (!fs.existsSync(backupFile)) {
  console.error(`Backup file not found: ${backupFile}`);
  process.exit(1);
}

const mysqlPath = getMysqlPath();

try {
  console.log(`Restoring database ${dbName} from ${backupFile}`);
  execFileSync(mysqlPath, [
    `--host=${dbHost}`,
    `--user=${dbUser}`,
    `--password=${dbPassword}`,
    dbName,
    ], {
      stdio: 'inherit',
      input: fs.readFileSync(backupFile),
  });

  console.log('Restore completed successfully.');
} catch (error) {
  console.error('Database restore failed:');
  console.error(error.message);
  process.exit(1);
}
