import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { milestones, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/milestones - Create a new milestone
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, title, description, order, completed } = body;

    if (!taskId || !title) {
      return NextResponse.json(
        { error: 'taskId and title are required' },
        { status: 400 }
      );
    }

    // Verify that the task belongs to the user
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (task.length === 0 || task[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // If order is not provided, get the max order and add 1
    let milestoneOrder = order;
    if (milestoneOrder === undefined) {
      const existingMilestones = await db
        .select()
        .from(milestones)
        .where(eq(milestones.taskId, taskId));

      milestoneOrder = existingMilestones.length > 0
        ? Math.max(...existingMilestones.map(m => m.order)) + 1
        : 0;
    }

    const newMilestone = await db
      .insert(milestones)
      .values({
        taskId,
        title,
        description: description || null,
        order: milestoneOrder,
        completed: completed || false,
      })
      .returning();

    return NextResponse.json(newMilestone[0], { status: 201 });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/milestones?taskId=xxx - Get all milestones for a task
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Verify that the task belongs to the user
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (task.length === 0 || task[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskMilestones = await db
      .select()
      .from(milestones)
      .where(eq(milestones.taskId, taskId))
      .orderBy(milestones.order);

    return NextResponse.json(taskMilestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
