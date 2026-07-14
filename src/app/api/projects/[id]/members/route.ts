import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id]/members - List project members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const projectId = params.id;

    const members = await db.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Error fetching project members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[id]/members - Add a user to a project (Admin or managing PM only)
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    if (role !== 'ADMIN' && project.managerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only Admins or the managing PM can assign members' }, { status: 403 });
    }

    const { assignUserId, roleInProject } = await request.json();

    if (!assignUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists
    const userToAssign = await db.user.findUnique({ where: { id: assignUserId } });
    if (!userToAssign) {
      return NextResponse.json({ error: 'User to assign not found' }, { status: 404 });
    }

    // Assign member
    const member = await db.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: assignUserId,
        },
      },
      update: {
        roleInProject: roleInProject || undefined,
      },
      create: {
        projectId,
        userId: assignUserId,
        roleInProject: roleInProject || 'Developer',
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ member, message: `Successfully assigned ${member.user.name} to the project` });
  } catch (error: any) {
    console.error('Error assigning project member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/members - Remove a user from a project (Admin or managing PM only)
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

    if (role !== 'ADMIN' && project.managerId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only Admins or the managing PM can remove members' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const removeUserId = searchParams.get('userId');

    if (!removeUserId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    await db.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: removeUserId,
        },
      },
    });

    // Unassign any tasks in this project assigned to this user
    await db.task.updateMany({
      where: {
        projectId,
        assigneeId: removeUserId,
      },
      data: {
        assigneeId: null,
      },
    });

    return NextResponse.json({ message: 'Member removed from project and their project tasks unassigned successfully' });
  } catch (error: any) {
    console.error('Error removing project member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
