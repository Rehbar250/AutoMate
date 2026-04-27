import { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';

const SUGGESTIONS = [
  'Send daily report and summarize emails',
  'Analyze sales data and find trends',
  'Scrape product info from a website',
  'Automate my daily tasks',
  'Generate a report from this data',
];

function StepCard({ step }) {
  const icons = { pending: 'fa-solid fa-circle', running: 'fa-solid fa-circle-notch fa-spin', completed: 'fa-solid fa-check', failed: 'fa-solid fa-xmark' };
  return (
    <div className={`step-card ${step.status}`}>
      <div className="step-header">
        <div className="step-number">{step.index + 1}</div>
        <span className="step-title">{step.description}</span>
        <span className="step-tool">{step.tool}</span>
        <i className={`step-status-icon ${icons[step.status] || icons.pending}`} style={{ color: step.status === 'completed' ? 'var(--green)' : step.status === 'failed' ? 'var(--red)' : step.status === 'running' ? 'var(--amber)' : 'var(--text-muted)' }}></i>
      </div>
      {step.reasoning && <div className="step-reasoning">💭 {step.reasoning}</div>}
      {step.durationMs > 0 && <div className="step-duration">⏱ {step.durationMs}ms</div>}
    </div>
  );
}

export default function Agent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSteps, setCurrentSteps] = useState([]);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, currentSteps]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: prompt, time: new Date() }]);
    setLoading(true);
    setCurrentSteps([]);

    try {
      const { executionId } = await api.agent.execute(prompt, sessionId);

      // Set up SSE stream
      const token = localStorage.getItem('automate_token');
      const es = new EventSource(`/api/agent/stream/${executionId}?token=${token}`);

      es.addEventListener('plan', (e) => {
        const data = JSON.parse(e.data);
        setMessages(prev => [...prev, { role: 'assistant', content: `🎯 **Goal:** ${data.goal}\n\n💡 ${data.reasoning}`, time: new Date(), type: 'plan' }]);
        setCurrentSteps(data.steps.map((s, i) => ({ ...s, index: i, status: 'pending' })));
      });

      es.addEventListener('step', (e) => {
        const data = JSON.parse(e.data);
        setCurrentSteps(prev => prev.map(s => s.index === data.index ? { ...s, ...data } : s));
      });

      es.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        setMessages(prev => [...prev, { role: 'assistant', content: `✅ Task completed! ${data.stepsCompleted} steps executed successfully using: ${data.toolsUsed?.join(', ')}`, time: new Date(), type: 'complete' }]);
        setLoading(false);
        es.close();
      });

      es.addEventListener('error', (e) => {
        try { const data = JSON.parse(e.data); setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${data.error}`, time: new Date(), type: 'error' }]); } catch {}
        setLoading(false);
        es.close();
      });

      es.onerror = () => { setLoading(false); es.close(); };
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Failed to start: ${err.message}`, time: new Date(), type: 'error' }]);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <h1 className="topbar-title"><i className="fa-solid fa-robot" style={{ color: 'var(--accent)', marginRight: '0.5rem' }}></i>AI Agent</h1>
        <span className="badge badge-info"><i className="fa-solid fa-wand-magic-sparkles"></i> Ready</span>
      </div>

      <div className="chat-container" style={{ margin: '0' }}>
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state fade-in">
              <i className="fa-solid fa-robot"></i>
              <h3>AutoMate AI Agent</h3>
              <p style={{ marginBottom: '1.5rem' }}>Tell me what you want to automate. I'll plan the steps, pick the right tools, and execute it for you.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} className="btn btn-ghost btn-sm" onClick={() => { setInput(s); inputRef.current?.focus(); }} style={{ fontSize: '0.8rem' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-bubble">
                {msg.content.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}
              </div>
              <div className="message-time" style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.time.toLocaleTimeString()}
              </div>
            </div>
          ))}

          {currentSteps.length > 0 && (
            <div className="message assistant">
              <div className="execution-steps">
                {currentSteps.map(step => <StepCard key={step.index} step={step} />)}
              </div>
            </div>
          )}

          {loading && currentSteps.length === 0 && (
            <div className="message assistant">
              <div className="thinking">
                <div className="thinking-dots"><span></span><span></span><span></span></div>
                <span className="thinking-text">Agent is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <form className="chat-input-wrapper" onSubmit={handleSubmit}>
            <input ref={inputRef} className="input chat-input" type="text" placeholder="Tell the AI agent what to do..." value={input} onChange={e => setInput(e.target.value)} disabled={loading} />
            <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
              <i className={loading ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-paper-plane'}></i>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
