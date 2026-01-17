import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/tasks - Get all tasks for the authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, session.user.id));

    return NextResponse.json(userTasks);
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
    const { title, description, dueDate, priority, tags, progress, archived } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
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
      })
      .returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
