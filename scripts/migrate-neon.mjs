import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function run() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  console.log('Connecting to Neon Postgres...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected! Reading neon/setup.sql...');

  const sql = fs.readFileSync('neon/setup.sql', 'utf8');
  console.log(`Executing SQL script (${sql.length} characters)...`);

  try {
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
