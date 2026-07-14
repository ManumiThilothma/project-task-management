import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!;
    const role = request.headers.get('x-user-role')!;

    // 1. Compile project whereClause
    let projectWhere: any = {};
    if (role === 'PROJECT_MANAGER') {
      projectWhere = {
        OR: [
          { managerId: userId },
          { members: { some: { userId } } }
        ]
      };
    } else if (role === 'TEAM_MEMBER') {
      projectWhere = {
        members: { some: { userId } }
      };
    }

    // 2. Compile task whereClause
    let taskWhere: any = {};
    if (role !== 'ADMIN') {
      taskWhere = {
        project: {
          OR: [
            { managerId: userId },
            { members: { some: { userId } } }
          ]
        }
      };
    }

    // 3. Parallel DB queries
    const [
      totalUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      recentProjects,
      recentTasks,
      activityLogs,
    ] = await Promise.all([
      // Only admins see system-wide user counts
      role === 'ADMIN' ? db.user.count() : Promise.resolve(0),
      db.project.count({ where: projectWhere }),
      db.task.count({ where: taskWhere }),
      db.task.count({ where: { ...taskWhere, status: 'DONE' } }),
      db.task.count({ where: { ...taskWhere, status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] } } }),
      
      // Recent Projects
      db.project.findMany({
        where: projectWhere,
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          manager: { select: { name: true } },
          _count: { select: { tasks: true } }
        }
      }),

      // Recent Tasks
      db.task.findMany({
        where: role === 'TEAM_MEMBER' ? { ...taskWhere, assigneeId: userId } : taskWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { name: true } },
          assignee: { select: { name: true } }
        }
      }),

      // Recent Activity Logs (Admin gets global logs, PM/Team see project logs)
      db.activityLog.findMany({
        where: role === 'ADMIN' ? {} : {
          task: {
            project: {
              OR: [
                { managerId: userId },
                { members: { some: { userId } } }
              ]
            }
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, role: true } },
          task: { select: { title: true } }
        }
      })
    ]);

    return NextResponse.json({
      stats: {
        usersCount: totalUsers,
        projectsCount: totalProjects,
        tasksCount: totalTasks,
        completedTasksCount: completedTasks,
        pendingTasksCount: pendingTasks,
      },
      recentProjects,
      recentTasks,
      activityLogs,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
