import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { milestones, tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// PATCH /api/milestones/[id] - Update a milestone
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the milestone first to verify ownership
    const milestone = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, id))
      .limit(1);

    if (milestone.length === 0) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Verify that the task belongs to the user
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, milestone[0].taskId))
      .limit(1);

    if (task.length === 0 || task[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, order, completed, completedAt } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (completed !== undefined) {
      updateData.completed = completed;
      // Auto-set completedAt when marked as completed
      if (completed && !completedAt) {
        updateData.completedAt = new Date();
      } else if (!completed) {
        updateData.completedAt = null;
      }
    }
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null;
    }

    const updatedMilestone = await db
      .update(milestones)
      .set(updateData)
      .where(eq(milestones.id, id))
      .returning();

    return NextResponse.json(updatedMilestone[0]);
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/milestones/[id] - Delete a milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get the milestone first to verify ownership
    const milestone = await db
      .select()
      .from(milestones)
      .where(eq(milestones.id, id))
      .limit(1);

    if (milestone.length === 0) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Verify that the task belongs to the user
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, milestone[0].taskId))
      .limit(1);

    if (task.length === 0 || task[0].userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.delete(milestones).where(eq(milestones.id, id));

    return NextResponse.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
