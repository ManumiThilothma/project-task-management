import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/projects - List projects visible to the current user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    let projects;

    if (role === 'ADMIN') {
      // Admins see all projects
      projects = await db.project.findMany({
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          tasks: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (role === 'PROJECT_MANAGER') {
      // PMs see projects they manage OR are members of
      projects = await db.project.findMany({
        where: {
          OR: [
            { managerId: userId },
            { members: { some: { userId } } },
          ],
        },
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          tasks: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Team members see only projects they are members of
      projects = await db.project.findMany({
        where: {
          members: { some: { userId } },
        },
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          tasks: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error('Error listing projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project (Admin or Project Manager only)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;
    
    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Only Admins and Project Managers can create projects' }, { status: 403 });
    }

    const { name, description, status, managerId, startDate, endDate } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Determine final manager ID
    let finalManagerId = userId;
    if (role === 'ADMIN' && managerId) {
      // If admin, they can assign any user as the manager, but let's verify if the user exists and has correct role
      const managerUser = await db.user.findUnique({ where: { id: managerId } });
      if (!managerUser) {
        return NextResponse.json({ error: 'Selected manager user not found' }, { status: 400 });
      }
      if (managerUser.role !== 'PROJECT_MANAGER' && managerUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Selected manager must have PROJECT_MANAGER or ADMIN role' }, { status: 400 });
      }
      finalManagerId = managerId;
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        status: (status || 'PLANNED') as any,
        managerId: finalManagerId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ project, message: 'Project created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
