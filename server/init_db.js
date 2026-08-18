/**
 * Database migration runner.
 *
 * A new database receives every SQL file in order. For an existing legacy
 * database (created before this runner kept a migration history), files
 * 001–007 are treated as already applied and only newer migrations run.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const LEGACY_MIGRATION_MAX = 7;

const escapeIdentifier = (value) => `\`${String(value).replace(/`/g, '``')}\``;

const getMigrationNumber = (fileName) => {
  const match = /^(\d+)_/.exec(fileName);
  return match ? Number(match[1]) : Number.NaN;
};

async function run() {
  const dbDir = path.resolve(__dirname, '..', 'database');
  if (!fs.existsSync(dbDir)) {
    throw new Error(`Database directory not found: ${dbDir}`);
  }

  const sqlFiles = fs.readdirSync(dbDir)
    // Only numbered migrations are executable. Backups may live beside them,
    // but must never be replayed by a deployment command.
    .filter((file) => /^\d+_[\w-]+\.sql$/.test(file))
    .sort();

  const host = process.env.DB_HOST || '127.0.0.1';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'elsirat_db';

  const connection = await mysql.createConnection({
    host,
    user,
    password,
    multipleStatements: true,
  });

  try {
    const [existingDatabases] = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [database],
    );
    const databaseAlreadyExists = existingDatabases.length > 0;

    if (databaseAlreadyExists) {
      await connection.query(`USE ${escapeIdentifier(database)}`);
    }

    let legacyDatabase = false;
    if (databaseAlreadyExists) {
      const [levelsTable] = await connection.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'levels'`,
        [database],
      );
      legacyDatabase = levelsTable.length > 0;
    }

    if (!databaseAlreadyExists) {
      const bootstrapMigration = sqlFiles.find((file) => getMigrationNumber(file) === 1);
      if (!bootstrapMigration) {
        throw new Error('Missing bootstrap migration 001_create_schema.sql');
      }

      console.log('Executing', bootstrapMigration);
      const bootstrapSql = fs.readFileSync(path.resolve(dbDir, bootstrapMigration), { encoding: 'utf8' });
      await connection.query(bootstrapSql);
      await connection.query(`CREATE TABLE IF NOT EXISTS ${escapeIdentifier('schema_migrations')} (
        filename VARCHAR(255) NOT NULL,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
      await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [bootstrapMigration]);
    }

    console.log('Connected to MySQL, executing migrations in', dbDir);
    for (const file of sqlFiles) {
      const migrationNumber = getMigrationNumber(file);
      if (!databaseAlreadyExists && migrationNumber === 1) {
        continue;
      }
      if (legacyDatabase && migrationNumber <= LEGACY_MIGRATION_MAX) {
        console.log('Skipping legacy migration', file);
        continue;
      }

      await connection.query(`USE ${escapeIdentifier(database)}`);
      await connection.query(`CREATE TABLE IF NOT EXISTS ${escapeIdentifier('schema_migrations')} (
        filename VARCHAR(255) NOT NULL,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

      const [applied] = await connection.query(
        'SELECT filename FROM schema_migrations WHERE filename = ? LIMIT 1',
        [file],
      );
      if (applied.length > 0) {
        console.log('Skipping applied migration', file);
        continue;
      }

      console.log('Executing', file);
      const sql = fs.readFileSync(path.resolve(dbDir, file), { encoding: 'utf8' });
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
    }

    console.log('All pending migrations executed.');
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error('Migration failed:', error.message || error);
  process.exit(2);
});
