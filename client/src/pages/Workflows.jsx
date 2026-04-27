import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => { api.workflows.list().then(d => setWorkflows(d.workflows)).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api.workflows.create({ name, description, steps: [] });
    setName(''); setDescription(''); setShowCreate(false); load();
  };

  const handleDelete = async (id) => { await api.workflows.delete(id); load(); };
  const handleExecute = async (id) => {
    try { await api.workflows.execute(id); alert('Workflow execution started!'); } catch (err) { alert(err.message); }
  };

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title"><i className="fa-solid fa-diagram-project" style={{ color: 'var(--cyan)', marginRight: '0.5rem' }}></i>Workflows</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}><i className="fa-solid fa-plus"></i> New Workflow</button>
      </div>

      <div className="page-content fade-in">
        {showCreate && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Create Workflow</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input className="input" placeholder="Workflow name" value={name} onChange={e => setName(e.target.value)} required />
              <textarea className="textarea" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" type="submit">Create</button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading...</p> : workflows.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-diagram-project"></i>
            <h3>No Workflows Yet</h3>
            <p>Create reusable automation workflows to save time on repetitive tasks.</p>
          </div>
        ) : (
          <div className="workflow-grid">
            {workflows.map(wf => (
              <div key={wf.id} className="workflow-card">
                <div className="workflow-card-header">
                  <span className="workflow-card-title">{wf.name}</span>
                  {wf.is_ai_generated ? <span className="badge badge-info">AI Generated</span> : null}
                </div>
                <div className="workflow-card-desc">{wf.description || 'No description'}</div>
                <div className="workflow-card-meta">
                  <span className="workflow-card-steps">{wf.steps?.length || 0} steps</span>
                  <div className="workflow-card-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleExecute(wf.id)}><i className="fa-solid fa-play"></i> Run</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(wf.id)}><i className="fa-solid fa-trash"></i></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
