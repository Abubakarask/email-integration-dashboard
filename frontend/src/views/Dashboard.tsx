import { useNavigate } from 'react-router-dom';
import { authApi } from '../app/data/auth';
import { LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Simple mock logic to fetch me
    const fetchUser = async () => {
      try {
        const userData = await authApi.me();
        setUser(userData);
      } catch (err) {
        // Not authenticated
        navigate('/login');
      }
    };
    
    // Disable to test unauthenticated rendering easily
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#0d1117',
      color: 'white',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <h1 style={{ background: 'linear-gradient(to right, #ffffff, #a5b4fc)', webkitBackgroundClip: 'text', webkitTextFillColor: 'transparent' }}>
        Dashboard
      </h1>
      <div style={{ marginTop: '20px', padding: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2>Welcome, {user?.name || 'User'}!</h2>
        <p style={{ color: '#8b949e' }}>You have successfully logged in.</p>
        
        <button 
          onClick={handleLogout}
          style={{
            marginTop: '20px',
            background: 'rgba(255, 107, 107, 0.15)',
            color: '#ff8787',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
