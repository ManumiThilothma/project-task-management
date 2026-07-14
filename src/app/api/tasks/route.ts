import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/tasks - List tasks (supports filtering by projectId)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assignedOnly = searchParams.get('assignedOnly') === 'true';

    let whereClause: any = {};

    // Filter by project
    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Filter by assignee
    if (assignedOnly || role === 'TEAM_MEMBER') {
      // If team member and no project specified, let's show all their assigned tasks.
      // If a project is specified, show all tasks in that project (since team members can see project tasks),
      // unless assignedOnly is specifically checked.
      if (assignedOnly || !projectId) {
        whereClause.assigneeId = userId;
      }
    }

    // Security check: non-admins should only see tasks in projects they belong to
    if (role !== 'ADMIN') {
      whereClause.project = {
        OR: [
          { managerId: userId },
          { members: { some: { userId } } },
        ],
      };
    }

    const tasks = await db.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task (Admin or managing PM of project only)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    const { title, description, priority, status, projectId, assigneeId, dueDate } = await request.json();

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and projectId are required' }, { status: 400 });
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Access check: ADMIN or managing PM of the project
    if (role !== 'ADMIN' && project.managerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only Admins or the project manager can add tasks' }, { status: 403 });
    }

    // Verify assignee is a project member or manager, if specified
    if (assigneeId) {
      const isMember = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      const isManager = project.managerId === assigneeId;

      if (!isMember && !isManager) {
        return NextResponse.json({ error: 'Assignee must be a member of this project or its manager' }, { status: 400 });
      }
    }

    // Create task
    const task = await db.task.create({
      data: {
        title,
        description,
        priority: (priority || 'MEDIUM') as any,
        status: (status || 'TODO') as any,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: userId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    // Create Activity Log
    await db.activityLog.create({
      data: {
        taskId: task.id,
        userId,
        actionType: 'CREATE',
        message: `Task created by ${role === 'ADMIN' ? 'Admin' : 'Project Manager'}.`,
      },
    });

    return NextResponse.json({ task, message: 'Task created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
