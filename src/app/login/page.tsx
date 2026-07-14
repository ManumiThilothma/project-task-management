'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './Login.module.css';
import { Mail, Lock, LogIn, AlertCircle, Kanban } from 'lucide-react';

export default function LoginPage() {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      // Error is already captured in AuthContext, but just in case:
      setLocalError(err.message || 'Failed to authenticate');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrefill = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLocalError(null);
    clearError();
  };

  return (
    <div className={styles.wrapper}>
      {/* Dynamic Glow Layers */}
      <div className={styles.blurGlow}></div>
      <div className={styles.blurGlow2}></div>

      <div className={`${styles.card} glass-panel`}>
        <div className={styles.header}>
          <Kanban size={40} className={styles.logoIcon} />
          <h2 className={styles.title}>Welcome to TaskFlow Pro</h2>
          <p className={styles.subtitle}>Sign in to manage your tasks & team projects</p>
        </div>

        {(localError || error) && (
          <div className={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.inputIcon} size={18} />
              <input
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.inputIcon} size={18} />
              <input
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className={styles.submitButton}>
            <LogIn size={18} />
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Demo Accounts Prefill Component */}
        <div className={styles.seedDemoInfo}>
          <div style={{ fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>
            Demo Role Accounts (Click to prefill):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handlePrefill('admin@taskflow.com', 'admin123')}
              style={{
                textAlign: 'left',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: 'hsl(350 89% 80%)',
              }}
            >
              <strong>Admin:</strong> admin@taskflow.com <span style={{opacity: 0.7}}>(admin123)</span>
            </button>
            
            <button
              type="button"
              onClick={() => handlePrefill('pm@taskflow.com', 'pm123')}
              style={{
                textAlign: 'left',
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.15)',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: 'hsl(263 90% 80%)',
              }}
            >
              <strong>Manager:</strong> pm@taskflow.com <span style={{opacity: 0.7}}>(pm123)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrefill('dev@taskflow.com', 'dev123')}
              style={{
                textAlign: 'left',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: 'hsl(142 70% 80%)',
              }}
            >
              <strong>Team Member:</strong> dev@taskflow.com <span style={{opacity: 0.7}}>(dev123)</span>
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={styles.footerLink}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
