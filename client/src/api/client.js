const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('automate_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...getHeaders(), ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
  },
  agent: {
    execute: (prompt, sessionId) => request('/agent/execute', { method: 'POST', body: JSON.stringify({ prompt, sessionId }) }),
    stream: (executionId) => {
      const token = localStorage.getItem('automate_token');
      return new EventSource(`${API_BASE}/agent/stream/${executionId}?token=${token}`);
    },
    executions: () => request('/agent/executions'),
    execution: (id) => request(`/agent/executions/${id}`),
  },
  workflows: {
    list: () => request('/workflows'),
    create: (body) => request('/workflows', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/workflows/${id}`, { method: 'DELETE' }),
    execute: (id) => request(`/workflows/${id}/execute`, { method: 'POST' }),
  },
  dashboard: {
    stats: () => request('/dashboard/stats'),
  },
  tools: {
    list: () => request('/tools'),
  },
  memory: {
    list: () => request('/memory'),
    add: (body) => request('/memory', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => request(`/memory/${id}`, { method: 'DELETE' }),
  },
  health: () => request('/health'),
};
