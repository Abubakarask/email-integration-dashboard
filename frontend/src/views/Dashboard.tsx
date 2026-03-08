import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, GmailStatusResponse } from '../app/data/auth';
import { LogOut, Mail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState<any>(null);
  const [gmailStatus, setGmailStatus] = useState<GmailStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Check for callback params
    const params = new URLSearchParams(location.search);
    if (params.get('connected') === 'true') {
      setToastMessage({ type: 'success', text: 'Gmail connected successfully!' });
      // clear params
      window.history.replaceState({}, '', '/dashboard');
    } else if (params.get('error')) {
      const errorMsg = params.get('error')?.replace(/_/g, ' ');
      setToastMessage({ type: 'error', text: `Connection failed: ${errorMsg}` });
      window.history.replaceState({}, '', '/dashboard');
    }

    const fetchData = async () => {
      try {
        const userData = await authApi.me();
        setUser(userData);
        
        try {
          const status = await authApi.getGmailStatus();
          setGmailStatus(status);
        } catch (err) {
          console.error("Failed to fetch gmail status", err);
        }
        
      } catch (err) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate, location]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleConnectGmail = async () => {
    try {
      const res = await authApi.connectGmail();
      if (res.auth_url) {
        window.location.href = res.auth_url;
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to generate connection URL' });
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await authApi.disconnectGmail();
      const status = await authApi.getGmailStatus();
      setGmailStatus(status);
      setToastMessage({ type: 'success', text: 'Gmail disconnected successfully!' });
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to disconnect Gmail' });
    }
  };

  if (loading) {
    return <div style={{ background: '#0d1117', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9d1d9' }}>Loading...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
      background: '#0d1117',
      color: '#c9d1d9',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <h1 style={{ background: 'linear-gradient(to right, #ffffff, #a5b4fc)', webkitBackgroundClip: 'text', webkitTextFillColor: 'transparent', marginBottom: '40px' }}>
        Integration Dashboard
      </h1>

      {toastMessage && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: toastMessage.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 107, 107, 0.1)',
          border: `1px solid ${toastMessage.type === 'success' ? '#4ade80' : '#ff6b6b'}`,
          color: toastMessage.type === 'success' ? '#4ade80' : '#ff8787'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toastMessage.text}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* User Card */}
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', color: '#ffffff' }}>Profile Options</h2>
          <p style={{ margin: '0 0 24px 0', color: '#8b949e' }}>Welcome back, <strong>{user?.name}</strong> ({user?.email})</p>
          
          <button onClick={handleLogout} style={{
            background: 'rgba(255, 107, 107, 0.1)', color: '#ff8787', border: '1px solid rgba(255, 107, 107, 0.2)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
          }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Gmail Integration Card */}
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Mail size={24} color="#a5b4fc" />
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff' }}>Gmail Integration</h2>
          </div>
          
          <p style={{ margin: '0 0 24px 0', color: '#8b949e', lineHeight: '1.6' }}>
            Connect your Gmail account to enable read and send permissions directly through the dashboard.
          </p>

          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '500' }}>Status</span>
              {gmailStatus?.status === 'connected' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '0.9rem', fontWeight: '500', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                  <CheckCircle2 size={14} /> Active
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b949e', fontSize: '0.9rem', fontWeight: '500', background: 'rgba(139, 148, 158, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                  <XCircle size={14} /> Not Connected
                </span>
              )}
            </div>

            {gmailStatus?.status === 'connected' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <span style={{ fontWeight: '500' }}>Connected Account</span>
                <span style={{ color: '#a5b4fc' }}>{gmailStatus.google_user_email}</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px' }}>
            {gmailStatus?.status === 'connected' ? (
              <button onClick={handleDisconnectGmail} style={{
                width: '100%', background: 'rgba(255, 107, 107, 0.1)', color: '#ff8787', border: '1px solid rgba(255, 107, 107, 0.2)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
              }}>
                <XCircle size={18} /> Disconnect from Gmail
              </button>
            ) : (
              <button onClick={handleConnectGmail} style={{
                width: '100%', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
              }}>
                <Mail size={18} /> Connect Gmail Account
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
