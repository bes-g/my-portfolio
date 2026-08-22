// One-time script: copies your existing cv.json content into the Postgres database.
// Run this ONCE after setting up the table: node migrate-cv-json-to-db.js

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'portfolio_db',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'April_7b'
});

async function migrate() {
  const cvPath = path.join(__dirname, 'cv.json');

  if (!fs.existsSync(cvPath)) {
    console.error('cv.json not found in this folder. Nothing to migrate.');
    process.exit(1);
  }

  const raw = fs.readFileSync(cvPath, 'utf8');
  let cv;
  try {
    cv = JSON.parse(raw);
  } catch (err) {
    console.error('cv.json is not valid JSON:', err.message);
    process.exit(1);
  }

  try {
    await pool.query(
      `INSERT INTO cv (id, data, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
      [JSON.stringify(cv)]
    );
    console.log('cv.json data successfully migrated into the database.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();