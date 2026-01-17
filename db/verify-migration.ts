import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env.local');
  }

  const client = postgres(connectionString);

  try {
    console.log('🔍 Verifying migration...\n');

    // Check if columns exist
    const result = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'task'
      AND column_name IN ('color', 'density')
      ORDER BY column_name;
    `;

    console.log('✅ Column information:');
    console.table(result);

    // Check existing tasks
    const tasks = await client`
      SELECT id, title, color, density
      FROM task
      LIMIT 5;
    `;

    console.log('\n📋 Sample tasks:');
    if (tasks.length === 0) {
      console.log('   No tasks found in database');
    } else {
      console.table(tasks);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

verifyMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
