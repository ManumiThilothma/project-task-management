'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/Login.module.css';
import { User, Mail, Lock, UserPlus, AlertCircle, Kanban } from 'lucide-react';

export default function RegisterPage() {
  const { register, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!name || !email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Failed to register account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Dynamic Glow Layers */}
      <div className={styles.blurGlow}></div>
      <div className={styles.blurGlow2}></div>

      <div className={`${styles.card} glass-panel`}>
        <div className={styles.header}>
          <Kanban size={40} className={styles.logoIcon} />
          <h2 className={styles.title}>Create your Account</h2>
          <p className={styles.subtitle}>Get started with team task management</p>
        </div>

        {(localError || error) && (
          <div className={styles.errorAlert}>
            <AlertCircle size={18} />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Full Name</label>
            <div className={styles.inputWrapper}>
              <User className={styles.inputIcon} size={18} />
              <input
                type="text"
                className={styles.input}
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

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
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className={styles.submitButton}>
            <UserPlus size={18} />
            <span>{submitting ? 'Creating account...' : 'Sign Up'}</span>
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" className={styles.footerLink}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
