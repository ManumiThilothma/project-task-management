import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH /api/tasks/[id]/status - Update task status/progress + optional comment (All permitted roles)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const taskId = params.id;
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    const { status, comment } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    if (!['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Find task
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Access control:
    // User must be ADMIN, the managing PM of the project, or a member of the project.
    if (role !== 'ADMIN' && task.project.managerId !== userId) {
      const membership = await db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to update tasks on this project' }, { status: 403 });
      }
    }

    const oldStatus = task.status;

    // Update status
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: { status: status as any },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    // Create activity log for status change
    let logMessage = `Changed status from ${oldStatus} to ${status}`;
    if (comment && comment.trim() !== '') {
      logMessage += `. Comment: "${comment.trim()}"`;
    }

    await db.activityLog.create({
      data: {
        taskId,
        userId,
        actionType: 'STATUS_CHANGE',
        message: logMessage,
      },
    });

    return NextResponse.json({ task: updatedTask, message: 'Task status updated successfully' });
  } catch (error: any) {
    console.error('Error updating task status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
