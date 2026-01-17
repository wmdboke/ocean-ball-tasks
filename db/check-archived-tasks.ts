import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkArchivedTasks() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env.local');
  }

  const client = postgres(connectionString);

  try {
    console.log('🔍 Checking archived tasks in database...\n');

    // Get all tasks
    const allTasks = await client`
      SELECT id, title, archived, progress, "completedAt", color, density
      FROM task
      ORDER BY archived, title;
    `;

    const activeTasks = allTasks.filter(t => !t.archived);
    const archivedTasks = allTasks.filter(t => t.archived);

    console.log(`📊 Total tasks: ${allTasks.length}`);
    console.log(`   Active: ${activeTasks.length}`);
    console.log(`   Archived: ${archivedTasks.length}\n`);

    if (activeTasks.length > 0) {
      console.log('✅ Active Tasks:');
      console.table(activeTasks.map(t => ({
        title: t.title,
        progress: t.progress,
        archived: t.archived,
        color: t.color,
        density: t.density
      })));
    }

    if (archivedTasks.length > 0) {
      console.log('\n📦 Archived Tasks:');
      console.table(archivedTasks.map(t => ({
        title: t.title,
        progress: t.progress,
        archived: t.archived,
        completedAt: t.completedAt,
        color: t.color,
        density: t.density
      })));
    } else {
      console.log('\n⚠️  No archived tasks found in database');
      console.log('   To test Archive feature:');
      console.log('   1. Create a task');
      console.log('   2. Complete all milestones (progress = 100%)');
      console.log('   3. Click "Archive" button');
      console.log('   4. Refresh page and click "Archive" menu button');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkArchivedTasks().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
