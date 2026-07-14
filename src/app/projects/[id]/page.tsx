'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './ProjectDetail.module.css';
import adminStyles from '../../admin/Admin.module.css';
import { 
  Calendar, 
  User, 
  Users, 
  Plus, 
  X, 
  CheckSquare, 
  AlertCircle, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  Activity, 
  MessageSquare,
  Clock,
  ExternalLink
} from 'lucide-react';

interface TaskActivity {
  id: string;
  actionType: string;
  message: string;
  createdAt: string;
  user: { name: string; role: string };
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  assignee: { id: string; name: string } | null;
  activityLogs?: TaskActivity[];
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  startDate: string | null;
  endDate: string | null;
  managerId: string;
  manager: { id: string; name: string; email: string };
  members: Array<{
    userId: string;
    roleInProject: string | null;
    user: { id: string; name: string; email: string; role: string };
  }>;
  tasks: TaskDetail[];
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = params.id;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  
  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskDetail | null>(null);
  
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Add Task states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Add Member states
  const [memberUserId, setMemberUserId] = useState('');
  const [memberProjectRole, setMemberProjectRole] = useState('Developer');

  // Task Status Update States (in task detail modal)
  const [newStatus, setNewStatus] = useState<'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'>('TODO');
  const [statusComment, setStatusComment] = useState('');

  // Error/Success state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        
        // If a task modal is active, update the active task view as well
        if (activeTask) {
          const updatedTask = data.project.tasks.find((t: TaskDetail) => t.id === activeTask.id);
          if (updatedTask) {
            // Re-fetch individual task endpoint to get latest logs
            fetchSingleTask(updatedTask.id);
          }
        }
      } else {
        router.push('/projects');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
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
      console.error('Error fetching single task:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchAllUsers();
  }, [projectId]);

  const isManagingUser = () => {
    if (!project || !currentUser) return false;
    return currentUser.role === 'ADMIN' || project.managerId === currentUser.id;
  };

  // Add Task Handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!taskTitle) {
      setErrorMessage('Task Title is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          projectId,
          assigneeId: taskAssignee || undefined,
          dueDate: taskDueDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      setShowCreateTaskModal(false);
      // Clear forms
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setTaskAssignee('');
      setTaskDueDate('');
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Member Handler
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!memberUserId) {
      setErrorMessage('Please select a user.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignUserId: memberUserId,
          roleInProject: memberProjectRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign member');
      }

      setShowAddMemberModal(false);
      setMemberUserId('');
      setMemberProjectRole('Developer');
      fetchProjectDetails();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove Member Handler
  const handleRemoveMember = async (targetUserId: string) => {
    const memberName = project?.members.find((m) => m.userId === targetUserId)?.user.name;
    if (!confirm(`Are you sure you want to remove "${memberName}" from this project? Their assigned tasks on this project will be set to Unassigned.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/members?userId=${targetUserId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      fetchProjectDetails();
    } catch (err: any) {
      alert(err.message || 'Error removing member');
    }
  };

  // Task Status Update Handler (inside task details modal)
  const handleUpdateTaskStatus = async (e: React.FormEvent) => {
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
        throw new Error(data.error || 'Failed to update task status');
      }

      setStatusComment('');
      // Refresh details
      fetchSingleTask(activeTask.id);
      fetchProjectDetails();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Task Handler
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to permanently delete this task?')) {
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      setShowTaskModal(false);
      setActiveTask(null);
      fetchProjectDetails();
    } catch (err: any) {
      alert(err.message || 'Error deleting task');
    }
  };

  // Delete Project Handler
  const handleDeleteProject = async () => {
    if (!confirm('CRITICAL WARNING: Are you sure you want to permanently delete this project and all its tasks? This action is irreversible.')) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      router.push('/projects');
    } catch (err: any) {
      alert(err.message || 'Error deleting project');
    }
  };

  // Open Task Detail View
  const handleOpenTaskDetails = (task: TaskDetail) => {
    setActiveTask(task);
    setNewStatus(task.status);
    setStatusComment('');
    setShowTaskModal(true);
    fetchSingleTask(task.id);
  };

  const getPriorityBadgeClass = (priority: string) => {
    if (priority === 'URGENT') return 'badge-danger';
    if (priority === 'HIGH') return 'badge-warning';
    if (priority === 'MEDIUM') return 'badge-primary';
    return 'badge-info';
  };

  if (loading || !project) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Loading project board details...</p>
      </div>
    );
  }

  // Group tasks by status for columns
  const todoTasks = project.tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS');
  const inReviewTasks = project.tasks.filter((t) => t.status === 'IN_REVIEW');
  const doneTasks = project.tasks.filter((t) => t.status === 'DONE');

  const columns = [
    { title: 'To Do', count: todoTasks.length, tasks: todoTasks, key: 'TODO' },
    { title: 'In Progress', count: inProgressTasks.length, tasks: inProgressTasks, key: 'IN_PROGRESS' },
    { title: 'In Review', count: inReviewTasks.length, tasks: inReviewTasks, key: 'IN_REVIEW' },
    { title: 'Done', count: doneTasks.length, tasks: doneTasks, key: 'DONE' },
  ];

  return (
    <div className={`${styles.container} animate-fade-in`}>
      {/* Project Header */}
      <div className={styles.projectHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.titleWrapper}>
            <h2 className={styles.projectTitle}>{project.name}</h2>
            <span className={`badge badge-primary`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            {project.description || 'No description provided.'}
          </p>
          <div className={styles.projectMeta}>
            <div className={styles.metaItem}>
              <User size={14} style={{ color: 'hsl(var(--text-muted))' }} />
              <span>Manager: <strong>{project.manager.name}</strong></span>
            </div>
            {(project.startDate || project.endDate) && (
              <div className={styles.metaItem}>
                <Calendar size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                <span>
                  Timeline: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Immediate'}
                  {' - '}
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Flexible'}
                </span>
              </div>
            )}
          </div>
        </div>

        {isManagingUser() && (
          <div className={styles.headerActions}>
            <button onClick={handleDeleteProject} className="badge badge-danger" style={{ display: 'flex', gap: '6px', padding: '10px 16px', textTransform: 'none', cursor: 'pointer', border: 'none', fontSize: '0.85rem' }}>
              <Trash2 size={16} />
              <span>Delete Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid Content Layout */}
      <div className={styles.layoutGrid}>
        
        {/* Kanban Board Container (Left Side) */}
        <div className={styles.boardContainer}>
          <div className={styles.boardHeader}>
            <h3 className={styles.boardTitle}>Project Workspace Kanban</h3>
            {isManagingUser() && (
              <button onClick={() => setShowCreateTaskModal(true)} className="badge badge-primary" style={{ display: 'flex', gap: '4px', textTransform: 'none', cursor: 'pointer', padding: '6px 12px' }}>
                <Plus size={14} /> Add Task
              </button>
            )}
          </div>

          <div className={styles.boardColumns}>
            {columns.map((col) => (
              <div key={col.key} className={styles.boardColumn}>
                <div className={col.key === 'DONE' ? `${styles.columnHeader} glow-text` : styles.columnHeader}>
                  <div className={styles.columnTitle}>
                    {col.key === 'DONE' && <CheckSquare size={14} style={{ color: 'hsl(var(--success))' }} />}
                    <span>{col.title}</span>
                  </div>
                  <span className={styles.columnCount}>{col.count}</span>
                </div>

                <div className={styles.columnCards}>
                  {col.tasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                      No tasks
                    </div>
                  ) : (
                    col.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={styles.taskCard}
                        onClick={() => handleOpenTaskDetails(task)}
                      >
                        <div className={styles.taskCardTitle}>{task.title}</div>
                        <div className={styles.taskCardFooter}>
                          <span className={`badge ${getPriorityBadgeClass(task.priority)}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                            {task.priority.toLowerCase()}
                          </span>
                          
                          {task.assignee ? (
                            <div 
                              className={styles.assigneeAvatar}
                              title={`Assigned to ${task.assignee.name}`}
                            >
                              {task.assignee.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                            </div>
                          ) : (
                            <span className={styles.unassignedText}>Unassigned</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Team Members Panel (Right Side) */}
        <div className={`${styles.teamPanel} glass-panel`}>
          <div className={styles.teamHeader}>
            <h3 className={styles.teamTitle}>Assigned Team ({project.members.length})</h3>
            {isManagingUser() && (
              <button 
                onClick={() => setShowAddMemberModal(true)} 
                className={styles.removeMemberBtn} 
                style={{ color: 'hsl(var(--primary))' }}
                title="Add member"
              >
                <UserPlus size={16} />
              </button>
            )}
          </div>

          <div className={styles.memberList}>
            <div className={styles.memberItem} style={{ background: 'rgba(124, 58, 237, 0.05)', borderColor: 'rgba(124, 58, 237, 0.1)' }}>
              <div className={styles.memberInfo}>
                <div className={styles.assigneeAvatar} style={{ background: 'linear-gradient(135deg, hsl(350 89% 60%) 0%, #ef4444 100%)' }}>
                  {project.manager.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className={styles.memberName}>{project.manager.name}</div>
                  <div className={styles.memberProjectRole} style={{ color: 'hsl(350 89% 70%)' }}>Project Manager (Owner)</div>
                </div>
              </div>
            </div>

            {project.members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                No developers assigned.
              </div>
            ) : (
              project.members.map((m) => (
                <div key={m.userId} className={styles.memberItem}>
                  <div className={styles.memberInfo}>
                    <div className={styles.assigneeAvatar}>
                      {m.user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.memberName}>{m.user.name}</div>
                      <div className={styles.memberProjectRole}>{m.roleInProject || 'Team Member'}</div>
                    </div>
                  </div>
                  {isManagingUser() && (
                    <button 
                      onClick={() => handleRemoveMember(m.userId)} 
                      className={styles.removeMemberBtn}
                      title="Remove member"
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Task Details Modal */}
      {showTaskModal && activeTask && (
        <div className={adminStyles.modalOverlay}>
          <div className={`${adminStyles.modal} glass-panel`} style={{ maxWidth: '600px' }}>
            <div className={adminStyles.modalHeader}>
              <h3 className={adminStyles.modalTitle}>Task Details</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isManagingUser() && (
                  <button 
                    onClick={() => handleDeleteTask(activeTask.id)} 
                    className={styles.removeMemberBtn}
                    style={{ color: 'hsl(var(--danger))', marginRight: '8px' }}
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button onClick={() => setShowTaskModal(false)} className={adminStyles.closeButton}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{activeTask.title}</h4>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
                  {activeTask.description || 'No description provided.'}
                </p>
              </div>

              {/* Task Meta details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Assignee:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {activeTask.assignee ? activeTask.assignee.name : 'Unassigned'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Priority:</span>
                  <div>
                    <span className={`badge ${getPriorityBadgeClass(activeTask.priority)}`}>
                      {activeTask.priority.toLowerCase()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Due Date:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Status:</span>
                  <div>
                    <span className={`badge ${activeTask.status === 'DONE' ? 'badge-success' : activeTask.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-warning'}`}>
                      {activeTask.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Update progress form */}
              <form onSubmit={handleUpdateTaskStatus} className={styles.commentBox} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '16px' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Update Status & Post Activity Comment</h5>
                
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
                    {submitting ? 'Updating...' : 'Post Status Change'}
                  </button>
                </div>

                <textarea 
                  className={styles.commentTextarea}
                  placeholder="Optional: Explain your progress or comment on the status change..."
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                />
              </form>

              {/* Logs timelines */}
              {activeTask.activityLogs && activeTask.activityLogs.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Task Activity Stream</h5>
                  <div className={styles.logsTimeline}>
                    {activeTask.activityLogs.map((log) => (
                      <div key={log.id} className={styles.logItem}>
                        <div className={styles.logDot}></div>
                        <div className={styles.logMessage}>
                          <strong>{log.user.name}</strong> {log.message}
                        </div>
                        <div className={styles.logTime}>
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

      {/* Add Task Modal */}
      {showCreateTaskModal && (
        <div className={adminStyles.modalOverlay}>
          <div className={`${adminStyles.modal} glass-panel`}>
            <div className={adminStyles.modalHeader}>
              <h3 className={adminStyles.modalTitle}>Create Project Task</h3>
              <button onClick={() => setShowCreateTaskModal(false)} className={adminStyles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div className={adminStyles.formGroup} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'hsl(350 89% 70%)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateTask} className={adminStyles.form}>
              <div className={adminStyles.formGroup}>
                <label className={adminStyles.label}>Task Title</label>
                <input 
                  type="text" 
                  className={adminStyles.input} 
                  placeholder="e.g. Implement user login UI"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className={adminStyles.formGroup}>
                <label className={adminStyles.label}>Description</label>
                <textarea 
                  className={adminStyles.input} 
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Describe task details, expected outputs and testing scope..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={adminStyles.formGroup}>
                  <label className={adminStyles.label}>Task Priority</label>
                  <select 
                    className={adminStyles.select}
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className={adminStyles.formGroup}>
                  <label className={adminStyles.label}>Due Date</label>
                  <input 
                    type="date" 
                    className={adminStyles.input}
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className={adminStyles.formGroup}>
                <label className={adminStyles.label}>Assignee</label>
                <select 
                  className={adminStyles.select}
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                >
                  <option value="">Unassigned (None)</option>
                  {/* Can assign to manager */}
                  <option value={project.manager.id}>{project.manager.name} (Manager)</option>
                  {/* Or project members */}
                  {project.members.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.user.name} ({m.roleInProject || 'Developer'})</option>
                  ))}
                </select>
              </div>

              <div className={adminStyles.modalActions}>
                <button type="button" onClick={() => setShowCreateTaskModal(false)} className={`${adminStyles.btn} ${adminStyles.btnSecondary}`}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}>
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className={adminStyles.modalOverlay}>
          <div className={`${adminStyles.modal} glass-panel`}>
            <div className={adminStyles.modalHeader}>
              <h3 className={adminStyles.modalTitle}>Assign Team Member</h3>
              <button onClick={() => setShowAddMemberModal(false)} className={adminStyles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div className={adminStyles.formGroup} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'hsl(350 89% 70%)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleAddMember} className={adminStyles.form}>
              <div className={adminStyles.formGroup}>
                <label className={adminStyles.label}>Select User</label>
                <select 
                  className={adminStyles.select}
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  required
                >
                  <option value="">Select a user in system...</option>
                  {/* Filter out user who is already a manager, or already assigned */}
                  {allUsers
                    .filter((u) => u.id !== project.managerId && !project.members.some((m) => m.userId === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ').toLowerCase()})</option>
                    ))}
                </select>
              </div>

              <div className={adminStyles.formGroup}>
                <label className={adminStyles.label}>Project Role Description</label>
                <input 
                  type="text" 
                  className={adminStyles.input} 
                  placeholder="e.g. UI/UX Designer, Lead Developer"
                  value={memberProjectRole}
                  onChange={(e) => setMemberProjectRole(e.target.value)}
                  required
                />
              </div>

              <div className={adminStyles.modalActions}>
                <button type="button" onClick={() => setShowAddMemberModal(false)} className={`${adminStyles.btn} ${adminStyles.btnSecondary}`}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}>
                  {submitting ? 'Assigning...' : 'Assign User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
