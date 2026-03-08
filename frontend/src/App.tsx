import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Integrations from './pages/Integrations';
import Login from './views/Login';

function ProtectedLayout() {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0a0a0a' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Routes>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/messages"     element={<Messages />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="*"             element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*"     element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
