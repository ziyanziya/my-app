SIRAT Database migration

Files:
- 001_create_schema.sql  -- full schema (creates database `elsirat_db` and tables)
- 008_prayer_wheel_events.sql -- configurable timing rules for non-obligatory wheel segments

Quick start (Node script)
1. Install dependencies in `server` folder:

```bash
cd my-app/server
npm install mysql2 dotenv
```

2. Copy `.env.sample` to `.env` and set your DB credentials.

3. Run the migration and seeds:

```bash
cd my-app/server
npm run migrate
```

This will run `001_create_schema.sql` and then `002_seed_initial_data.sql` if present.

Direct using `mysql` client:

```bash
mysql -h 127.0.0.1 -u root -p < database/001_create_schema.sql
```

Notes:
- The SQL file creates database `elsirat_db` and sets `utf8mb4` collation.
- The five obligatory prayers remain calculated from the user's location. `prayer_wheel_events` stores the other wheel segments as an offset from a prayer or another segment, so an admin dashboard can adjust their order and timing without changing the prayer calculation.
- For production, run migrations using a proper migration tool (Flyway, Liquibase, knex/umzug, Sequelize migrations, etc.) and do not run raw SQL manually on critical DBs.
- After migration, seed `levels`, `activity_categories` and initial `achievements` as needed.
