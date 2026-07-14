import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id] - Get project details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const projectId = params.id;
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    // Find the project first
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Access control: User must be Admin, the Project Manager, or a project member
    const isMember = project.members.some((m) => m.userId === userId);
    const isManager = project.managerId === userId;

    if (role !== 'ADMIN' && !isManager && !isMember) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this project' }, { status: 403 });
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error('Error fetching project details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update project details (Admin or managing PM only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const projectId = params.id;
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Access check: ADMIN or managing PM
    if (role !== 'ADMIN' && project.managerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only Admins or the managing PM can modify this project' }, { status: 403 });
    }

    const { name, description, status, managerId, startDate, endDate } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Build update dataset
    const updateData: any = {
      name,
      description,
      status: status as any,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };

    // If Admin changing manager
    if (role === 'ADMIN' && managerId && managerId !== project.managerId) {
      const managerUser = await db.user.findUnique({ where: { id: managerId } });
      if (!managerUser || (managerUser.role !== 'PROJECT_MANAGER' && managerUser.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Selected manager must be an Admin or Project Manager' }, { status: 400 });
      }
      updateData.managerId = managerId;
    }

    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ project: updatedProject, message: 'Project updated successfully' });
  } catch (error: any) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete project (Admin or managing PM only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const projectId = params.id;
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Access check: ADMIN or managing PM
    if (role !== 'ADMIN' && project.managerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only Admins or the managing PM can delete this project' }, { status: 403 });
    }

    await db.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
