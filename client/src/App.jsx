import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Agent from './pages/Agent';
import Workflows from './pages/Workflows';
import History from './pages/History';
import Tools from './pages/Tools';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#8b92ab' }}>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="agent" element={<Agent />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="history" element={<History />} />
        <Route path="tools" element={<Tools />} />
      </Route>
    </Routes>
  );
}
