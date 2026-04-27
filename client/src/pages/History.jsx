import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function History() {
  const [executions, setExecutions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.agent.executions().then(d => setExecutions(d.executions)).catch(console.error).finally(() => setLoading(false)); }, []);

  const viewDetails = async (id) => {
    if (selected === id) { setSelected(null); return; }
    setSelected(id);
    try { const data = await api.agent.execution(id); setLogs(data.logs || []); } catch { setLogs([]); }
  };

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title"><i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--amber)', marginRight: '0.5rem' }}></i>Execution History</h1>
      </div>

      <div className="page-content fade-in">
        {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading...</p> : executions.length === 0 ? (
          <div className="empty-state"><i className="fa-solid fa-clock-rotate-left"></i><h3>No History Yet</h3><p>Run your first AI task to see it here.</p></div>
        ) : (
          <div className="card" style={{ overflow: 'auto' }}>
            <table className="history-table">
              <thead><tr><th>Status</th><th>Prompt</th><th>Started</th><th>Completed</th><th></th></tr></thead>
              <tbody>
                {executions.map(exec => (
                  <>
                    <tr key={exec.id} style={{ cursor: 'pointer' }} onClick={() => viewDetails(exec.id)}>
                      <td><span className={`badge ${exec.status === 'completed' ? 'badge-success' : exec.status === 'failed' ? 'badge-error' : 'badge-warning'}`}><span className="badge-dot"></span>{exec.status}</span></td>
                      <td style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exec.prompt || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(exec.started_at).toLocaleString()}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{exec.completed_at ? new Date(exec.completed_at).toLocaleString() : '—'}</td>
                      <td><i className={`fa-solid fa-chevron-${selected === exec.id ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}></i></td>
                    </tr>
                    {selected === exec.id && (
                      <tr key={`${exec.id}-detail`}><td colSpan={5} style={{ padding: '1rem', background: 'rgba(99,102,241,0.03)' }}>
                        {logs.length > 0 ? (
                          <div className="execution-steps">
                            {logs.map((log, i) => (
                              <div key={i} className={`step-card ${log.status}`}>
                                <div className="step-header">
                                  <div className="step-number">{log.step_index + 1}</div>
                                  <span className="step-title">{log.description}</span>
                                  <span className="step-tool">{log.tool_name}</span>
                                  <span className={`badge ${log.status === 'completed' ? 'badge-success' : 'badge-error'}`}>{log.status}</span>
                                </div>
                                {log.reasoning && <div className="step-reasoning">💭 {log.reasoning}</div>}
                                {log.duration_ms > 0 && <div className="step-duration">⏱ {log.duration_ms}ms</div>}
                              </div>
                            ))}
                          </div>
                        ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No execution logs available.</p>}
                      </td></tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
