import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { tasks, milestones } from '@/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { DbMilestone } from '@/app/types/database';

// GET /api/tasks - Get all tasks with their milestones for the authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. 查询所有 tasks
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, session.user.id));

    // 2. 如果有 tasks，批量查询所有 milestones
    let allMilestones: DbMilestone[] = [];
    if (userTasks.length > 0) {
      const taskIds = userTasks.map(t => t.id);
      allMilestones = await db
        .select()
        .from(milestones)
        .where(inArray(milestones.taskId, taskIds))
        .orderBy(asc(milestones.order));
    }

    // 3. 组装数据：为每个 task 添加其 milestones
    const tasksWithMilestones = userTasks.map(task => ({
      ...task,
      milestones: allMilestones.filter(m => m.taskId === task.id),
    }));

    return NextResponse.json(tasksWithMilestones);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, dueDate, priority, tags, progress, archived, color, density } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!color) {
      return NextResponse.json({ error: 'Color is required' }, { status: 400 });
    }

    if (density === undefined || density === null) {
      return NextResponse.json({ error: 'Density is required' }, { status: 400 });
    }

    const newTask = await db
      .insert(tasks)
      .values({
        userId: session.user.id,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || null,
        tags: tags || [],
        progress: progress || 0,
        archived: archived || false,
        color,
        density,
      })
      .returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
