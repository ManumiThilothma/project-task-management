'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './Projects.module.css';
import adminStyles from '../admin/Admin.module.css';
import { 
  FolderPlus, 
  Search, 
  Calendar, 
  User, 
  Users, 
  Plus, 
  X, 
  CheckSquare, 
  AlertCircle 
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  startDate: string | null;
  endDate: string | null;
  manager: { id: string; name: string; email: string };
  members: Array<{
    userId: string;
    roleInProject: string | null;
    user: { id: string; name: string; email: string };
  }>;
  tasks: Array<{
    id: string;
    status: string;
  }>;
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Project Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'>('PLANNED');
  const [managerId, setManagerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [managers, setManagers] = useState<UserSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    // Only needed if Admin creates a project
    if (user?.role !== 'ADMIN') return;
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        // Filter to PMs and Admins
        const filtered = data.users.filter(
          (u: UserSummary) => u.role === 'PROJECT_MANAGER' || u.role === 'ADMIN'
        );
        setManagers(filtered);
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchManagers();
  }, [user]);

  const handleOpenCreateModal = () => {
    setName('');
    setDescription('');
    setStatus('PLANNED');
    setManagerId(user?.role === 'ADMIN' ? '' : user?.id || '');
    setStartDate('');
    setEndDate('');
    setErrorMessage(null);
    setShowCreateModal(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name) {
      setErrorMessage('Project Name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          status,
          managerId: user?.role === 'ADMIN' ? managerId : undefined, // PM automatically sets on server
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setShowCreateModal(false);
      fetchProjects();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') return 'badge-success';
    if (status === 'IN_PROGRESS') return 'badge-primary';
    if (status === 'ON_HOLD') return 'badge-danger';
    return 'badge-warning';
  };

  // Filter projects based on search & select
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.manager.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Loading projects directory...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header Actions & Filter */}
      <div className={styles.headerActions}>
        <div className={styles.filters}>
          <input 
            type="text" 
            className={styles.search}
            placeholder="Search projects, description, or managers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
          <button onClick={handleOpenCreateModal} className="badge badge-primary" style={{ display: 'flex', gap: '6px', padding: '10px 18px', textTransform: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', borderRadius: '12px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          <FolderPlus size={48} style={{ marginBottom: '16px', color: 'hsl(var(--primary))' }} />
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>No projects found matching the filter criteria.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProjects.map((p) => {
            const totalTasks = p.tasks.length;
            const completedTasks = p.tasks.filter((t) => t.status === 'DONE').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div key={p.id} className={`${styles.projectCard} glass-panel`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.projectName}>{p.name}</h3>
                  <span className={`badge ${getStatusBadge(p.status)}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>

                <p className={styles.projectDesc}>
                  {p.description || 'No description added for this project yet.'}
                </p>

                {/* Progress bar */}
                <div className={styles.progressWrapper}>
                  <div className={styles.progressHeader}>
                    <span>Progress</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFill} style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                {/* Metadata */}
                <div className={styles.cardMeta}>
                  <div className={styles.metaItem}>
                    <User size={14} className={styles.metaIcon} />
                    <span>Manager: <strong>{p.manager.name}</strong></span>
                  </div>

                  {(p.startDate || p.endDate) && (
                    <div className={styles.metaItem}>
                      <Calendar size={14} className={styles.metaIcon} />
                      <span>
                        {p.startDate ? new Date(p.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : 'Anytime'}
                        {' → '}
                        {p.endDate ? new Date(p.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : 'Ongoing'}
                      </span>
                    </div>
                  )}

                  <div className={styles.metaItem}>
                    <CheckSquare size={14} className={styles.metaIcon} />
                    <span>Tasks: {completedTasks} / {totalTasks} completed</span>
                  </div>
                </div>

                {/* Member avatars & Footer Link */}
                <div className={styles.cardFooter}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>Team Members:</span>
                    {p.members.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>Unassigned</span>
                    ) : (
                      <div className={styles.memberAvatars}>
                        {p.members.slice(0, 4).map((m) => (
                          <div 
                            key={m.userId} 
                            className={styles.avatarMini}
                            title={`${m.user.name} (${m.roleInProject || 'Member'})`}
                          >
                            {m.user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                          </div>
                        ))}
                        {p.members.length > 4 && (
                          <div className={`${styles.avatarMini} ${styles.avatarMore}`} title={`${p.members.length - 4} more members`}>
                            +{p.members.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Link href={`/projects/${p.id}`} className="badge badge-primary" style={{ textTransform: 'none', cursor: 'pointer', padding: '6px 12px' }}>
                    Open Board
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className={adminStyles.modalOverlay}>
          <div className={`${adminStyles.modal} glass-panel`}>
            <div className={adminStyles.modalHeader}>
              <h3 className={adminStyles.modalTitle}>Create New Project</h3>
              <button onClick={() => setShowCreateModal(false)} className={adminStyles.closeButton}>
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

            <form onSubmit={handleCreateProject} className={adminStyles.form}>
              <div className={adminStyles.formGroup}>
                <label className={adminStyles.label}>Project Name</label>
                <input 
                  type="text" 
                  className={adminStyles.input} 
                  placeholder="e.g. Website Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={adminStyles.formGroup}>
                <label className={adminStyles.label}>Description</label>
                <textarea 
                  className={adminStyles.input} 
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Summarize the project goals and delivery timelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {user?.role === 'ADMIN' && (
                <div className={adminStyles.formGroup}>
                  <label className={adminStyles.label}>Assign Project Manager</label>
                  <select 
                    className={adminStyles.select}
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    required
                  >
                    <option value="">Select a Manager...</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={adminStyles.formGroup}>
                  <label className={adminStyles.label}>Start Date</label>
                  <input 
                    type="date" 
                    className={adminStyles.input}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className={adminStyles.formGroup}>
                  <label className={adminStyles.label}>End Date</label>
                  <input 
                    type="date" 
                    className={adminStyles.input}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className={adminStyles.formGroup}>
                <label className={adminStyles.label}>Initial Project Status</label>
                <select 
                  className={adminStyles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="PLANNED">Planned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>

              <div className={adminStyles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={`${adminStyles.btn} ${adminStyles.btnSecondary}`}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={`${adminStyles.btn} ${adminStyles.btnPrimary}`}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
