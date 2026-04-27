import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.dashboard.stats().then(setStats).catch(console.error);
  }, []);

  const quickActions = [
    { label: 'New AI Task', icon: 'fa-solid fa-robot', color: 'purple', path: '/agent' },
    { label: 'Create Workflow', icon: 'fa-solid fa-diagram-project', color: 'cyan', path: '/workflows' },
    { label: 'View History', icon: 'fa-solid fa-clock-rotate-left', color: 'amber', path: '/history' },
    { label: 'Browse Tools', icon: 'fa-solid fa-toolbox', color: 'green', path: '/tools' },
  ];

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title">Dashboard</h1>
        <div className="topbar-right">
          <span className="badge badge-success"><span className="badge-dot"></span> System Online</span>
        </div>
      </div>

      <div className="page-content fade-in">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple"><i className="fa-solid fa-bolt"></i></div>
            <div className="stat-info"><h4>Total Executions</h4><div className="stat-value">{stats?.totalExecutions || 0}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><i className="fa-solid fa-circle-check"></i></div>
            <div className="stat-info"><h4>Success Rate</h4><div className="stat-value">{stats?.successRate || 0}%</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cyan"><i className="fa-solid fa-diagram-project"></i></div>
            <div className="stat-info"><h4>Saved Workflows</h4><div className="stat-value">{stats?.totalWorkflows || 0}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber"><i className="fa-solid fa-toolbox"></i></div>
            <div className="stat-info"><h4>Active Tools</h4><div className="stat-value">{stats?.availableTools || 0}</div></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}><i className="fa-solid fa-bolt" style={{ color: 'var(--accent)', marginRight: '0.5rem' }}></i>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {quickActions.map(a => (
                <button key={a.label} className="btn btn-ghost" style={{ padding: '1rem', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }} onClick={() => navigate(a.path)}>
                  <i className={a.icon} style={{ fontSize: '1.25rem', color: `var(--${a.color === 'purple' ? 'accent' : a.color})` }}></i>
                  <span style={{ fontSize: '0.8rem' }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}><i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--accent)', marginRight: '0.5rem' }}></i>Recent Activity</h3>
            {stats?.recentExecutions?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stats.recentExecutions.map(exec => (
                  <div key={exec.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(99,102,241,0.04)', borderRadius: '8px' }}>
                    <span className={`badge ${exec.status === 'completed' ? 'badge-success' : exec.status === 'failed' ? 'badge-error' : 'badge-warning'}`}>
                      {exec.status}
                    </span>
                    <span style={{ fontSize: '0.85rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exec.prompt || 'Workflow execution'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(exec.started_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No activity yet. Start by running an AI task!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
