import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const runSQL = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const connection = postgres(process.env.DATABASE_URL, { max: 1 });

  console.log('⏳ Running SQL migration...');

  const sqlPath = path.join(process.cwd(), 'drizzle', '0001_add_tasks_and_milestones.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  const start = Date.now();

  try {
    await connection.unsafe(sql);
    const end = Date.now();
    console.log(`✅ Migration completed in ${end - start}ms`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  await connection.end();
  process.exit(0);
};

runSQL().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
