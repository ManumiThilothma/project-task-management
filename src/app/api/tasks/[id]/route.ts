import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/tasks/[id] - Get task details, including activity logs
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const taskId = params.id;
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, name: true, managerId: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        activityLogs: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Security check: non-admins must be a member of the project
    if (role !== 'ADMIN') {
      const membership = await db.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId,
        },
      });

      const isManager = task.project.managerId === userId;

      if (!membership && !isManager) {
        return NextResponse.json({ error: 'Forbidden: You do not have access to this project\'s tasks' }, { status: 403 });
      }
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tasks/[id] - Update task details (Admin or managing PM only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const taskId = params.id;
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Access check: ADMIN or managing PM of project
    if (role !== 'ADMIN' && task.project.managerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only Admins or project managers can edit task details' }, { status: 403 });
    }

    const { title, description, priority, status, assigneeId, dueDate } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verify assignee if changed
    if (assigneeId && assigneeId !== task.assigneeId) {
      const isMember = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: assigneeId } },
      });
      const isManager = task.project.managerId === assigneeId;

      if (!isMember && !isManager) {
        return NextResponse.json({ error: 'Assignee must be a member of this project' }, { status: 400 });
      }
    }

    // Track activity changes
    const changes: string[] = [];
    if (title !== task.title) changes.push(`title to "${title}"`);
    if (description !== task.description) changes.push('description');
    if (priority !== task.priority) changes.push(`priority to ${priority}`);
    if (status !== task.status) changes.push(`status to ${status}`);
    if (assigneeId !== task.assigneeId) {
      if (assigneeId) {
        const newAssignee = await db.user.findUnique({ where: { id: assigneeId } });
        changes.push(`assignee to ${newAssignee?.name}`);
      } else {
        changes.push('assignee to Unassigned');
      }
    }

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        priority: priority as any,
        status: status as any,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    // Create Activity Log if there were changes
    if (changes.length > 0) {
      await db.activityLog.create({
        data: {
          taskId,
          userId,
          actionType: 'UPDATE',
          message: `Updated task details: ${changes.join(', ')}.`,
        },
      });
    }

    return NextResponse.json({ task: updatedTask, message: 'Task updated successfully' });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] - Delete task (Admin or managing PM only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const taskId = params.id;
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Access check: ADMIN or managing PM of project
    if (role !== 'ADMIN' && task.project.managerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only Admins or project managers can delete tasks' }, { status: 403 });
    }

    await db.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
