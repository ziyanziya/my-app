const db = require('./src/config/db');
(async () => {
  try {
    const [rows] = await db.query('SELECT id, name, title, `order` FROM worships ORDER BY `order` ASC, id ASC');
    rows.forEach((r) => console.log(`${r.id}|${r.name}|${r.title}|${r.order}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
