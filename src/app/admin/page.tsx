'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './Admin.module.css';
import { 
  UserPlus, 
  Edit2, 
  Trash2, 
  X, 
  ShieldAlert, 
  Mail, 
  User, 
  Lock, 
  Shield 
} from 'lucide-react';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';
  createdAt: string;
}

export default function AdminPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER'>('TEAM_MEMBER');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('TEAM_MEMBER');
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword(''); // leave blank unless changing password
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowEditModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name || !email || !password || !role) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccessMessage('User created successfully!');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccessMessage('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userToDelete: SystemUser) => {
    if (userToDelete.id === currentAdmin?.id) {
      alert('Security Alert: You cannot delete your own Administrator account.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete user "${userToDelete.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccessMessage('User deleted successfully.');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') return 'badge-danger';
    if (role === 'PROJECT_MANAGER') return 'badge-primary';
    return 'badge-success';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Loading system user directory...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className={styles.adminHeader}>
        <div>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            System-level control center for roles, memberships, and authentication.
          </p>
        </div>
        <button onClick={handleOpenCreate} className="badge badge-primary" style={{ display: 'flex', gap: '6px', padding: '10px 18px', textTransform: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
          <UserPlus size={16} />
          <span>Add New User</span>
        </button>
      </div>

      {successMessage && (
        <div className="badge badge-success" style={{ display: 'block', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', textTransform: 'none', width: 'fit-content' }}>
          {successMessage}
        </div>
      )}

      {/* Users table */}
      <div className={`${styles.tableWrapper} glass-panel`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Email Address</th>
              <th className={styles.th}>System Role</th>
              <th className={styles.th}>Registered On</th>
              <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.userName}>{u.name}</div>
                  {u.id === currentAdmin?.id && (
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--danger))', fontWeight: 600 }}>(You)</span>
                  )}
                </td>
                <td className={styles.td} style={{ color: 'hsl(var(--text-secondary))' }}>{u.email}</td>
                <td className={styles.td}>
                  <span className={`badge ${getRoleBadge(u.role)}`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className={styles.td} style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                  {new Date(u.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className={styles.td}>
                  <div className={styles.actions} style={{ justifyContent: 'center' }}>
                    <button 
                      onClick={() => handleOpenEdit(u)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                      title="Edit User Role"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      title="Delete User"
                      disabled={u.id === currentAdmin?.id}
                      style={{ opacity: u.id === currentAdmin?.id ? 0.3 : 1, cursor: u.id === currentAdmin?.id ? 'not-allowed' : 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass-panel`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add System User</h3>
              <button onClick={() => setShowCreateModal(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div className={styles.formGroup} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'hsl(350 89% 70%)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ShieldAlert size={16} />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateUser} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  placeholder="jane.smith@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Temporary Password</label>
                <input 
                  type="password" 
                  className={styles.input} 
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Security Role Authorization</label>
                <select 
                  className={styles.select}
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="TEAM_MEMBER">Team Member (Developer, QA, Analyst)</option>
                  <option value="PROJECT_MANAGER">Project Manager (PM, Supervisor)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={`${styles.btn} styles.btnSecondary`}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={`${styles.btn} ${styles.btnPrimary}`}>
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass-panel`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Modify User Details</h3>
              <button onClick={() => setShowEditModal(false)} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div className={styles.formGroup} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'hsl(350 89% 70%)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ShieldAlert size={16} />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleEditUser} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Update Password (optional)</label>
                <input 
                  type="password" 
                  className={styles.input} 
                  placeholder="Leave blank to keep current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Security Role Authorization</label>
                <select 
                  className={styles.select}
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  disabled={selectedUser.id === currentAdmin?.id}
                >
                  <option value="TEAM_MEMBER">Team Member</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
                {selectedUser.id === currentAdmin?.id && (
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    You cannot change your own Administrator role permission.
                  </p>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowEditModal(false)} className={`${styles.btn} styles.btnSecondary`}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={`${styles.btn} ${styles.btnPrimary}`}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
