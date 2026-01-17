import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const checkTables = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const connection = postgres(process.env.DATABASE_URL, { max: 1 });

  console.log('📋 Checking existing tables...\n');

  const result = await connection`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  console.log('Existing tables:');
  result.forEach(row => console.log(`  - ${row.table_name}`));

  console.log('\n📋 Checking task table columns...\n');

  const taskColumns = await connection`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'task'
    ORDER BY ordinal_position;
  `;

  if (taskColumns.length > 0) {
    console.log('Task table columns:');
    taskColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default || ''}`);
    });
  } else {
    console.log('❌ Task table does not exist');
  }

  console.log('\n📋 Checking milestone table columns...\n');

  const milestoneColumns = await connection`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'milestone'
    ORDER BY ordinal_position;
  `;

  if (milestoneColumns.length > 0) {
    console.log('Milestone table columns:');
    milestoneColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default || ''}`);
    });
  } else {
    console.log('❌ Milestone table does not exist');
  }

  await connection.end();
  process.exit(0);
};

checkTables().catch((err) => {
  console.error('❌ Check failed');
  console.error(err);
  process.exit(1);
});
