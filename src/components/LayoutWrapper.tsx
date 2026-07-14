'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './LayoutWrapper.module.css';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  LogOut, 
  Kanban,
  Menu,
  X
} from 'lucide-react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If path is login or register, or root, don't show sidebar layout
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/';

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p style={{ color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>Verifying Session...</p>
      </div>
    );
  }

  // If not authenticated or on auth page, render raw children
  if (!user || isAuthPage) {
    return <>{children}</>;
  }

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard Overview';
    if (pathname.startsWith('/projects')) {
      if (pathname === '/projects') return 'Projects';
      return 'Project Board';
    }
    if (pathname === '/tasks') return 'My Task Board';
    if (pathname === '/admin') return 'System User Administration';
    return 'Management Platform';
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
  ];

  // Only show Admin Panel to ADMIN role
  if (user.role === 'ADMIN') {
    navItems.push({ name: 'Admin Control', href: '/admin', icon: Users });
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarLogo}>
          <Kanban size={28} className={styles.logoIcon} />
          <span className={styles.logoText}>TaskFlow Pro</span>
        </div>

        <nav className={styles.navSection}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} className={styles.navIcon} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.profileSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>
          <div style={{ padding: '0 4px' }}>
            <span className={`badge badge-${
              user.role === 'ADMIN' ? 'danger' : user.role === 'PROJECT_MANAGER' ? 'primary' : 'success'
            }`}>
              {user.role.replace('_', ' ')}
            </span>
          </div>
          <button onClick={logout} className={styles.logoutButton}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainLayout}>
        <header className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={toggleMobileMenu} 
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--text-primary))',
                cursor: 'pointer',
                display: 'none', // Shown in CSS via media queries
              }}
              className="mobile-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className={styles.headerTitle}>{getPageTitle()}</h1>
          </div>
          
          <div className={styles.headerActions}>
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
              Welcome back, <strong>{user.name.split(' ')[0]}</strong>
            </span>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
