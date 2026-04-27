import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function Tools() {
  const [tools, setTools] = useState([]);

  useEffect(() => { api.tools.list().then(d => setTools(d.tools)).catch(console.error); }, []);

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title"><i className="fa-solid fa-toolbox" style={{ color: 'var(--green)', marginRight: '0.5rem' }}></i>Available Tools</h1>
        <span className="badge badge-info">{tools.length} tools</span>
      </div>

      <div className="page-content fade-in">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          These are the tools available to the AI agent. When you give it a task, it automatically selects and chains the right tools together.
        </p>
        <div className="tools-grid">
          {tools.map(tool => (
            <div key={tool.name} className="tool-card">
              <div className="tool-icon">{tool.icon}</div>
              <div className="tool-info">
                <h4>{tool.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h4>
                <p>{tool.description}</p>
                <div className="tool-category">{tool.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
