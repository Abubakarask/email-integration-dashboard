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
    <div className="bg-black min-h-screen flex justify-center">
      <div className="flex h-screen w-full max-w-[1280px] bg-zinc-950 border-l border-r border-zinc-900 overflow-hidden relative">
        <Sidebar  />
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto mb-14 md:mb-0">
          <Routes>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/messages"     element={<Messages />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="*"             element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
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
