import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGmailStatusQuery, useConnectGmailMutation, useDisconnectGmailMutation } from '../app/data/google';

const styles = {
  page: {
    padding: '40px',
    backgroundColor: '#0a0a0a',
    minHeight: '100vh',
    color: '#ffffff',
    fontFamily: "'DM Mono', monospace",
  },
  heading: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  subheading: {
    fontSize: '13px',
    color: '#4b5563',
    marginBottom: '40px',
  },
  card: {
    backgroundColor: '#111111',
    border: '1px solid #1e1e1e',
    borderRadius: '12px',
    padding: '28px',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  gmailIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#1a1a1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  cardTitle: { fontSize: '15px', fontWeight: '600', color: '#f9fafb' },
  cardDesc: { fontSize: '12px', color: '#4b5563', lineHeight: '1.6' },
  connectedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#052e16',
    color: '#4ade80',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid #14532d',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#4ade80',
  },
  email: {
    fontSize: '12px',
    color: '#6b7280',
  },
  connectBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ffffff',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '13px',
    fontFamily: "'DM Mono', monospace",
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    transition: 'opacity 0.15s ease',
  },
  disconnectBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    color: '#ef4444',
    border: '1px solid #1f2937',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '12px',
    fontFamily: "'DM Mono', monospace",
    cursor: 'pointer',
    alignSelf: 'flex-start',
    transition: 'border-color 0.15s ease',
  },
  toast: (type: 'success' | 'error') => ({
    position: 'fixed' as const,
    top: '24px',
    right: '24px',
    backgroundColor: type === 'success' ? '#052e16' : '#1a0a0a',
    border: `1px solid ${type === 'success' ? '#14532d' : '#3f1515'}`,
    color: type === 'success' ? '#4ade80' : '#f87171',
    padding: '12px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: "'DM Mono', monospace",
    zIndex: 1000,
  }),
};

// Gmail SVG logo
function GmailLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#f1f3f4"/>
      <path d="M20 4L12 13 4 4" stroke="#EA4335" strokeWidth="2"/>
      <path d="M2 6l10 7 10-7" fill="none" stroke="#34A853" strokeWidth="0"/>
      <path d="M4 4l8 9 8-9H4z" fill="#EA4335"/>
      <path d="M2 6v12l5-6-5-6z" fill="#4285F4"/>
      <path d="M22 6v12l-5-6 5-6z" fill="#FBBC05"/>
      <path d="M17 12l5 6H2l5-6 5 7 5-7z" fill="#34A853"/>
    </svg>
  );
}

export default function Integrations() {
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // TanStack React Query Hooks for fetching connection status automatically
  const { data, isLoading, error } = useGmailStatusQuery();
  const connectMutation = useConnectGmailMutation();
  const disconnectMutation = useDisconnectGmailMutation();

  const status = data?.status || 'not_connected';
  const email = data?.google_user_email;

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      showToast('Gmail connected successfully!', 'success');
      window.history.replaceState({}, '', '/integrations');
    }
    if (searchParams.get('error')) {
      showToast('Failed to connect Gmail. Please try again.', 'error');
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams]);

  async function handleConnect() {
    try {
      const res = await connectMutation.mutateAsync();
      window.location.href = res.auth_url; // redirect to Google OAuth
    } catch (err) {
      showToast('Could not initiate Gmail connection.', 'error');
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectMutation.mutateAsync();
      showToast('Gmail disconnected.', 'success');
    } catch (err) {
      showToast('Failed to disconnect.', 'error');
    }
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div style={styles.page}>
      {toast && (
        <div style={styles.toast(toast.type)}>{toast.message}</div>
      )}

      <h1 style={styles.heading}>Integrations</h1>
      <p style={styles.subheading}>Connect your accounts to sync and manage emails.</p>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.gmailIcon}><GmailLogo /></div>
          <div>
            <div style={styles.cardTitle}>Gmail</div>
            <div style={styles.cardDesc}>Sync your inbox and reply to threads.</div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ color: '#374151', fontSize: '13px' }}>Checking status...</div>
        ) : status === 'connected' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.connectedBadge}>
                <div style={styles.dot} />
                Connected
              </div>
              <span style={styles.email}>{email}</span>
            </div>
            <button style={styles.disconnectBtn} onClick={handleDisconnect} disabled={disconnectMutation.isPending}>
              Disconnect
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.7' }}>
              Connect your Gmail account to sync emails and reply to threads directly from this dashboard.
            </div>
            <button style={styles.connectBtn} onClick={handleConnect} disabled={connectMutation.isPending}>
              <GmailLogo />
              Connect Gmail
            </button>
          </>
        )}
      </div>
    </div>
  );
}
