import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testArchiveFlow() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env.local');
  }

  const client = postgres(connectionString);

  try {
    console.log('🧪 Testing Archive Flow...\n');

    // Step 1: Get current state
    console.log('📊 Step 1: Current database state');
    const allTasks = await client`
      SELECT id, title, archived, progress, "completedAt"
      FROM task
      ORDER BY archived, title;
    `;

    console.log(`Total tasks: ${allTasks.length}`);
    console.log(`Active: ${allTasks.filter(t => !t.archived).length}`);
    console.log(`Archived: ${allTasks.filter(t => t.archived).length}\n`);

    // Step 2: Find a task with progress >= 100 that's not archived
    const candidateTask = allTasks.find(t => t.progress >= 100 && !t.archived);

    if (candidateTask) {
      console.log('✅ Found task ready to archive:');
      console.log(`   ID: ${candidateTask.id}`);
      console.log(`   Title: ${candidateTask.title}`);
      console.log(`   Progress: ${candidateTask.progress}`);
      console.log(`   Archived: ${candidateTask.archived}\n`);

      // Step 3: Simulate archive operation
      console.log('🔄 Step 2: Simulating archive operation...');
      const now = new Date().toISOString();

      await client`
        UPDATE task
        SET
          archived = true,
          "completedAt" = ${now}::timestamp,
          "updatedAt" = ${now}::timestamp
        WHERE id = ${candidateTask.id};
      `;

      console.log(`✅ Updated task in database\n`);

      // Step 4: Verify update
      console.log('🔍 Step 3: Verifying update...');
      const updatedTask = await client`
        SELECT id, title, archived, progress, "completedAt"
        FROM task
        WHERE id = ${candidateTask.id};
      `;

      if (updatedTask.length > 0) {
        console.log('✅ Task after update:');
        console.table(updatedTask.map(t => ({
          title: t.title,
          progress: t.progress,
          archived: t.archived,
          completedAt: t.completedAt
        })));
      }

      // Step 5: Show all archived tasks
      console.log('\n📦 Step 4: All archived tasks now:');
      const archivedTasks = await client`
        SELECT id, title, progress, "completedAt"
        FROM task
        WHERE archived = true
        ORDER BY "completedAt" DESC;
      `;

      if (archivedTasks.length > 0) {
        console.table(archivedTasks.map(t => ({
          title: t.title,
          progress: t.progress,
          completedAt: t.completedAt
        })));
      } else {
        console.log('No archived tasks');
      }

    } else {
      console.log('⚠️  No tasks with progress >= 100 found to archive');
      console.log('   Current tasks with high progress:');
      const highProgressTasks = allTasks.filter(t => !t.archived);
      console.table(highProgressTasks.map(t => ({
        title: t.title,
        progress: t.progress,
        archived: t.archived
      })));
    }

    // Final summary
    console.log('\n📈 Final Summary:');
    const finalCount = await client`
      SELECT
        COUNT(*) FILTER (WHERE archived = false) as active,
        COUNT(*) FILTER (WHERE archived = true) as archived
      FROM task;
    `;
    console.log(`Active tasks: ${finalCount[0].active}`);
    console.log(`Archived tasks: ${finalCount[0].archived}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

testArchiveFlow().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
