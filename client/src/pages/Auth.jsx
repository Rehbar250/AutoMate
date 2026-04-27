import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <i className="fa-solid fa-bolt-lightning" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
        </div>
        <h1 className="auth-title">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to your AutoMate AI platform' : 'Start automating with AI intelligence'}
        </p>

        {error && <div className="auth-error"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="input" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> Please wait...</> : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <a onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </a>
        </div>
      </div>
    </div>
  );
}
