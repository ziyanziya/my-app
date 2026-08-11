const db = require('../src/config/db');

async function run() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error('Usage: npm run make-admin -- user@example.com');
  const [result] = await db.query('UPDATE users SET role = "admin", updated_at = NOW(3) WHERE email = ?', [email]);
  if (!result.affectedRows) throw new Error(`No user exists with email: ${email}`);
  console.log(`Administrator access granted to ${email}`);
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
