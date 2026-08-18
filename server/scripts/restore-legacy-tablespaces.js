/*
 * Recovers file-per-table InnoDB files into an isolated database.
 * Usage: node scripts/restore-legacy-tablespaces.js prepare|import|report
 */
const db = require('../src/config/db');

const sourceDatabase = process.env.DB_NAME || 'elsirat_db';
const recoveryDatabase = `${sourceDatabase}_legacy_recovery`;

const quote = (identifier) => `\`${String(identifier).replace(/`/g, '``')}\``;

async function tables() {
  const [rows] = await db.query(
    'SELECT TABLE_NAME AS name FROM information_schema.tables WHERE table_schema = ? AND engine = "InnoDB" ORDER BY TABLE_NAME',
    [sourceDatabase],
  );
  return rows.map(({ name }) => name);
}

async function prepare() {
  const names = await tables();
  await db.query(`CREATE DATABASE IF NOT EXISTS ${quote(recoveryDatabase)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  for (const name of names) {
    await db.query(`DROP TABLE IF EXISTS ${quote(recoveryDatabase)}.${quote(name)}`);
    await db.query(`CREATE TABLE ${quote(recoveryDatabase)}.${quote(name)} LIKE ${quote(sourceDatabase)}.${quote(name)}`);
    await db.query(`ALTER TABLE ${quote(recoveryDatabase)}.${quote(name)} DISCARD TABLESPACE`);
  }
  console.log(JSON.stringify({ recoveryDatabase, tables: names, status: 'ready_for_ibd_files' }, null, 2));
}

async function importTablespaces() {
  const names = await tables();
  const results = [];
  for (const name of names) {
    try {
      await db.query(`ALTER TABLE ${quote(recoveryDatabase)}.${quote(name)} IMPORT TABLESPACE`);
      const [rows] = await db.query(`SELECT COUNT(*) AS count FROM ${quote(recoveryDatabase)}.${quote(name)}`);
      results.push({ table: name, imported: true, rows: rows[0].count });
    } catch (error) {
      results.push({ table: name, imported: false, error: error.message });
    }
  }
  console.log(JSON.stringify({ recoveryDatabase, results }, null, 2));
  if (results.some((result) => !result.imported)) process.exitCode = 2;
}

async function report() {
  const names = await tables();
  const [rows] = await db.query(
    `SELECT table_name AS name, table_rows AS estimated_rows FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name`,
    [recoveryDatabase],
  );
  const result = [];
  for (const name of names) {
    try {
      const [count] = await db.query(`SELECT COUNT(*) AS count FROM ${quote(recoveryDatabase)}.${quote(name)}`);
      result.push({ table: name, rows: count[0].count });
    } catch (error) {
      result.push({ table: name, error: error.message });
    }
  }
  console.log(JSON.stringify({ recoveryDatabase, informationSchema: rows, counts: result }, null, 2));
}

const mode = process.argv[2];
const action = { prepare, import: importTablespaces, report }[mode];
if (!action) throw new Error('Usage: node scripts/restore-legacy-tablespaces.js prepare|import|report');

action()
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
