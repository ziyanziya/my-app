const db = require('../src/config/db');
const userRepo = require('../src/repositories/user.repo');
const { hashPassword } = require('../src/utils/hash');

async function run() {
  const [email] = process.argv.slice(2);
  const password = process.env.SIRAT_NEW_PASSWORD;
  if (!email || !password) throw new Error('Set SIRAT_NEW_PASSWORD, then run: npm run reset-password -- user@example.com');
  if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
  const user = await userRepo.findByEmail(email.trim().toLowerCase());
  if (!user) throw new Error(`No user exists with email: ${email}`);
  await userRepo.updatePassword(user.id, await hashPassword(password));
  console.log('Password updated successfully.');
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
