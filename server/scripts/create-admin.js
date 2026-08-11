const { v4: uuidv4 } = require('uuid');
const db = require('../src/config/db');
const userRepo = require('../src/repositories/user.repo');
const { hashPassword } = require('../src/utils/hash');

async function run() {
  const [email, name = 'مدير الصراط'] = process.argv.slice(2);
  const password = process.env.SIRAT_NEW_PASSWORD;
  if (!email || !password) throw new Error('Set SIRAT_NEW_PASSWORD, then run: npm run create-admin -- user@example.com [name]');
  if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
  const normalizedEmail = email.trim().toLowerCase();
  if (await userRepo.findByEmail(normalizedEmail)) throw new Error('A user already exists with this email. Use make-admin or reset-password instead.');
  await userRepo.createUser({
    uuid: uuidv4(), name, email: normalizedEmail, password_hash: await hashPassword(password),
    timezone: 'Africa/Casablanca', locale: 'ar', role: 'admin',
  });
  console.log('Administrator account created successfully.');
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
