import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const BALL_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
const DENSITY_MIN = 0.15;
const DENSITY_MAX = 0.8;

async function updateExistingTasks() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in .env.local');
  }

  const client = postgres(connectionString);

  try {
    console.log('🔄 Updating existing tasks with random colors and densities...\n');

    // Get all tasks with default values
    const tasksToUpdate = await client`
      SELECT id, title
      FROM task
      WHERE color = '#FF6B6B' AND density = 0.5;
    `;

    if (tasksToUpdate.length === 0) {
      console.log('✅ No tasks need updating (all have custom colors/densities)');
      return;
    }

    console.log(`📊 Found ${tasksToUpdate.length} tasks with default values\n`);

    let updated = 0;
    for (const task of tasksToUpdate) {
      const randomColor = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
      const randomDensity = DENSITY_MIN + Math.random() * (DENSITY_MAX - DENSITY_MIN);

      await client`
        UPDATE task
        SET color = ${randomColor}, density = ${randomDensity}
        WHERE id = ${task.id};
      `;

      console.log(`✓ Updated "${task.title}": color=${randomColor}, density=${randomDensity.toFixed(3)}`);
      updated++;
    }

    console.log(`\n✅ Successfully updated ${updated} tasks!`);

    // Verify updates
    const verifyTasks = await client`
      SELECT id, title, color, density
      FROM task
      ORDER BY density
      LIMIT 10;
    `;

    console.log('\n📋 Sample tasks after update:');
    console.table(verifyTasks);

  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

updateExistingTasks().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
