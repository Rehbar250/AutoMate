import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', icon: 'fa-solid fa-chart-line', label: 'Dashboard', end: true },
  { to: '/agent', icon: 'fa-solid fa-robot', label: 'AI Agent' },
  { to: '/workflows', icon: 'fa-solid fa-diagram-project', label: 'Workflows' },
  { to: '/history', icon: 'fa-solid fa-clock-rotate-left', label: 'History' },
  { to: '/tools', icon: 'fa-solid fa-toolbox', label: 'Tools' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <i className="fa-solid fa-bolt-lightning"></i>
          <span>AutoMate</span>
          <span className="sidebar-badge">AI</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <i className={item.icon}></i>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
            <i className="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
