import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env.local');
  }

  // Create postgres connection
  const client = postgres(connectionString);

  try {
    console.log('🔄 Running migration: 0001_add_color_density.sql');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '0001_add_color_density.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration
    await client.unsafe(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('   - Added color column to task table');
    console.log('   - Added density column to task table');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
