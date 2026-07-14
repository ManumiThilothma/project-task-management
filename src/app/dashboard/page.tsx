'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './Dashboard.module.css';
import { 
  Folder, 
  CheckCircle2, 
  Clock, 
  Users, 
  Plus, 
  Activity, 
  ChevronRight, 
  ClipboardList 
} from 'lucide-react';

interface DashboardData {
  stats: {
    usersCount: number;
    projectsCount: number;
    tasksCount: number;
    completedTasksCount: number;
    pendingTasksCount: number;
  };
  recentProjects: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    manager: { name: string };
    _count: { tasks: number };
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    project: { name: string };
    assignee?: { name: string } | null;
  }>;
  activityLogs: Array<{
    id: string;
    actionType: string;
    message: string;
    createdAt: string;
    user: { name: string; role: string };
    task?: { title: string } | null;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Loading statistics dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel" style={{ padding: '32px', borderRadius: '12px', textAlign: 'center' }}>
        <p style={{ color: 'hsl(var(--danger))' }}>Failed to load dashboard data. Please try refreshing.</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    if (priority === 'URGENT') return 'badge-danger';
    if (priority === 'HIGH') return 'badge-warning';
    if (priority === 'MEDIUM') return 'badge-primary';
    return 'badge-info';
  };

  const getStatusColor = (status: string) => {
    if (status === 'DONE') return 'badge-success';
    if (status === 'IN_REVIEW') return 'badge-warning';
    if (status === 'IN_PROGRESS') return 'badge-primary';
    return 'badge-info';
  };

  return (
    <div className="animate-fade-in">
      {/* Overview stats grids */}
      <div className={styles.grid}>
        {user?.role === 'ADMIN' && (
          <div className={`${styles.statCard} glass-panel`}>
            <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'hsl(350 89% 60%)' }}>
              <Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{data.stats.usersCount}</div>
              <div className={styles.statLabel}>Total Platform Users</div>
            </div>
          </div>
        )}

        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statIcon} style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'hsl(263 90% 62%)' }}>
            <Folder size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{data.stats.projectsCount}</div>
            <div className={styles.statLabel}>Active Projects</div>
          </div>
        </div>

        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statIcon} style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'hsl(199 89% 48%)' }}>
            <ClipboardList size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{data.stats.tasksCount}</div>
            <div className={styles.statLabel}>Tracked Tasks</div>
          </div>
        </div>

        <div className={`${styles.statCard} glass-panel`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'hsl(142 70% 45%)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{data.stats.completedTasksCount}</div>
            <div className={styles.statLabel}>Tasks Completed</div>
          </div>
        </div>

        {user?.role !== 'ADMIN' && (
          <div className={`${styles.statCard} glass-panel`}>
            <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'hsl(38 92% 50%)' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{data.stats.pendingTasksCount}</div>
              <div className={styles.statLabel}>Tasks Pending</div>
            </div>
          </div>
        )}
      </div>

      {/* Main dashboard panels */}
      <div className={styles.panelGrid}>
        {/* Left Side Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Projects Panel */}
          <div className={`${styles.panel} glass-panel`}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>
                <Folder size={18} style={{ color: 'hsl(var(--primary))' }} />
                <span>Recent Projects</span>
              </h3>
              <Link href="/projects" className={styles.panelAction}>
                View All
              </Link>
            </div>

            {data.recentProjects.length === 0 ? (
              <div className={styles.emptyState}>
                <Folder size={36} />
                <p>No projects assigned yet.</p>
                {(user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN') && (
                  <Link href="/projects" className="badge badge-primary" style={{ display: 'flex', gap: '4px', textTransform: 'none' }}>
                    <Plus size={14} /> Create a Project
                  </Link>
                )}
              </div>
            ) : (
              <div className={styles.projectList}>
                {data.recentProjects.map((project) => (
                  <Link href={`/projects/${project.id}`} key={project.id} className={styles.projectItem}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemName}>{project.name}</div>
                      <div className={styles.itemDesc}>{project.description || 'No description provided.'}</div>
                      <div className={styles.itemMeta}>
                        <span>Manager: <strong>{project.manager.name}</strong></span>
                        <span>•</span>
                        <span>{project._count.tasks} Tasks</span>
                      </div>
                    </div>
                    <div className={styles.itemSide}>
                      <span className={`badge ${
                        project.status === 'COMPLETED' ? 'badge-success' : project.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-warning'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      <ChevronRight size={16} style={{ color: 'hsl(var(--text-muted))' }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Panel */}
          <div className={`${styles.panel} glass-panel`}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>
                <ClipboardList size={18} style={{ color: 'hsl(var(--primary))' }} />
                <span>{user?.role === 'TEAM_MEMBER' ? 'My Tasks Assignment' : 'Latest Project Tasks'}</span>
              </h3>
              <Link href={user?.role === 'TEAM_MEMBER' ? '/tasks' : '/projects'} className={styles.panelAction}>
                View Board
              </Link>
            </div>

            {data.recentTasks.length === 0 ? (
              <div className={styles.emptyState}>
                <CheckCircle2 size={36} style={{ color: 'hsl(var(--success))' }} />
                <p>All clean! No tasks assigned.</p>
              </div>
            ) : (
              <div className={styles.taskList}>
                {data.recentTasks.map((task) => (
                  <div key={task.id} className={styles.taskItem}>
                    <div className={styles.itemMain}>
                      <div className={styles.itemName}>{task.title}</div>
                      <div className={styles.itemMeta}>
                        <span>Project: <strong>{task.project.name}</strong></span>
                        {task.assignee && (
                          <>
                            <span>•</span>
                            <span>Assignee: <strong>{task.assignee.name}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={styles.itemSide}>
                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {task.priority.toLowerCase()}
                      </span>
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side Activity Log Timeline */}
        <div className={`${styles.panel} glass-panel`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>
              <Activity size={18} style={{ color: 'hsl(var(--primary))' }} />
              <span>Platform Activity Stream</span>
            </h3>
          </div>

          {data.activityLogs.length === 0 ? (
            <div className={styles.emptyState}>
              <Activity size={36} />
              <p>No activity logs recorded yet.</p>
            </div>
          ) : (
            <div className={styles.activityList}>
              {data.activityLogs.map((log) => (
                <div key={log.id} className={styles.activityItem}>
                  <div className={styles.activityIndicator}></div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityText}>
                      <strong>{log.user.name}</strong>{' '}
                      <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                        ({log.user.role.replace('_', ' ')})
                      </span>{' '}
                      {log.message.replace(/Task created/, '')}{' '}
                      {log.task && (
                        <span>
                          on task <strong>{log.task.title}</strong>
                        </span>
                      )}
                    </div>
                    <div className={styles.activityTime}>
                      {new Date(log.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
