'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './Tasks.module.css';
import detailStyles from '../projects/[id]/ProjectDetail.module.css';
import adminStyles from '../admin/Admin.module.css';
import { 
  Calendar, 
  X, 
  CheckSquare, 
  Clock, 
  MessageSquare, 
  Folder, 
  Activity, 
  ClipboardList 
} from 'lucide-react';

interface TaskActivity {
  id: string;
  actionType: string;
  message: string;
  createdAt: string;
  user: { name: string; role: string };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  project: { id: string; name: string };
  assignee: { id: string; name: string } | null;
  creator: { id: string; name: string } | null;
  activityLogs?: TaskActivity[];
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Status Change Forms
  const [newStatus, setNewStatus] = useState<'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'>('TODO');
  const [statusComment, setStatusComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?assignedOnly=true');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);

        // Update active task if modal open
        if (activeTask) {
          const updated = data.tasks.find((t: Task) => t.id === activeTask.id);
          if (updated) {
            fetchSingleTask(updated.id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveTask(data.task);
        setNewStatus(data.task.status);
      }
    } catch (err) {
      console.error('Error fetching single task logs:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenTask = (task: Task) => {
    setActiveTask(task);
    setNewStatus(task.status);
    setStatusComment('');
    setShowModal(true);
    fetchSingleTask(task.id);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tasks/${activeTask.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      setStatusComment('');
      fetchSingleTask(activeTask.id);
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    if (priority === 'URGENT') return 'badge-danger';
    if (priority === 'HIGH') return 'badge-warning';
    if (priority === 'MEDIUM') return 'badge-primary';
    return 'badge-info';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Loading personal task board...</p>
      </div>
    );
  }

  // Group tasks for columns
  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const inReviewTasks = tasks.filter((t) => t.status === 'IN_REVIEW');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  const columns = [
    { title: 'To Do', count: todoTasks.length, tasks: todoTasks, key: 'TODO' },
    { title: 'In Progress', count: inProgressTasks.length, tasks: inProgressTasks, key: 'IN_PROGRESS' },
    { title: 'In Review', count: inReviewTasks.length, tasks: inReviewTasks, key: 'IN_REVIEW' },
    { title: 'Done', count: doneTasks.length, tasks: doneTasks, key: 'DONE' },
  ];

  return (
    <div className="animate-fade-in">
      <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '20px' }}>
        Track, filter, and update progress of tasks assigned to you across all projects in the system.
      </p>

      {tasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', borderRadius: '12px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          <ClipboardList size={48} style={{ marginBottom: '16px', color: 'hsl(var(--success))' }} />
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>No tasks currently assigned to your account.</p>
        </div>
      ) : (
        <div className={styles.boardColumns}>
          {columns.map((col) => (
            <div key={col.key} className={styles.column}>
              <div className={col.key === 'DONE' ? `${styles.columnHeader} glow-text` : styles.columnHeader}>
                <div className={styles.columnTitle}>
                  {col.key === 'DONE' && <CheckSquare size={14} style={{ color: 'hsl(var(--success))' }} />}
                  <span>{col.title}</span>
                </div>
                <span className={styles.columnCount}>{col.count}</span>
              </div>

              <div className={styles.cardsList}>
                {col.tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 10px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                    No tasks
                  </div>
                ) : (
                  col.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={styles.taskCard}
                      onClick={() => handleOpenTask(task)}
                    >
                      <div className={styles.projectLabel}>
                        <Folder size={10} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline' }} />
                        <span style={{ fontSize: '0.7rem' }}>{task.project.name}</span>
                      </div>
                      <div className={styles.taskTitle}>{task.title}</div>
                      <div className={styles.taskCardFooter}>
                        <span className={`badge ${getPriorityBadgeClass(task.priority)}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                          {task.priority.toLowerCase()}
                        </span>
                        
                        {task.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                            <Calendar size={10} />
                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      {showModal && activeTask && (
        <div className={adminStyles.modalOverlay}>
          <div className={`${adminStyles.modal} glass-panel`} style={{ maxWidth: '600px' }}>
            <div className={adminStyles.modalHeader}>
              <h3 className={adminStyles.modalTitle}>Personal Task Board</h3>
              <button onClick={() => setShowModal(false)} className={adminStyles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className={styles.projectLabel} style={{ marginBottom: '8px', display: 'inline-flex' }}>
                  <Folder size={12} style={{ marginRight: '4px' }} />
                  <span>Project: {activeTask.project.name}</span>
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{activeTask.title}</h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
                  {activeTask.description || 'No description provided.'}
                </p>
              </div>

              {/* Task Meta details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Task Owner/Creator:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {activeTask.creator ? activeTask.creator.name : 'Unknown'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Priority Badge:</span>
                  <div>
                    <span className={`badge ${getPriorityBadgeClass(activeTask.priority)}`}>
                      {activeTask.priority.toLowerCase()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Task Due Date:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Active Status:</span>
                  <div>
                    <span className={`badge ${activeTask.status === 'DONE' ? 'badge-success' : activeTask.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-warning'}`}>
                      {activeTask.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Update progress form */}
              <form onSubmit={handleUpdateStatus} className={detailStyles.commentBox} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '16px' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Log Activity Comments & Update Status</h5>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                  <select 
                    className={adminStyles.select}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    required
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                  <button type="submit" disabled={submitting} className={`${adminStyles.btn} ${adminStyles.btnPrimary}`} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    {submitting ? 'Updating...' : 'Log Progress'}
                  </button>
                </div>

                <textarea 
                  className={detailStyles.commentTextarea}
                  placeholder="Describe your progress, milestones achieved, or blockers..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                />
              </form>

              {/* Logs timelines */}
              {activeTask.activityLogs && activeTask.activityLogs.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Task Activity Stream</h5>
                  <div className={detailStyles.logsTimeline}>
                    {activeTask.activityLogs.map((log) => (
                      <div key={log.id} className={detailStyles.logItem}>
                        <div className={detailStyles.logDot}></div>
                        <div className={detailStyles.logMessage}>
                          <strong>{log.user.name}</strong> {log.message}
                        </div>
                        <div className={detailStyles.logTime}>
                          {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
