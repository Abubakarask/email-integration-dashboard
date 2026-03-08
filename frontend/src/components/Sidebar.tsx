import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: '/messages',
    label: 'Messages',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: '/integrations',
    label: 'Integrations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
        <path d="M6 21V9a9 9 0 0 0 9 9" />
      </svg>
    ),
  },
];

const styles = {
  sidebar: {
    width: '220px',
    height: '100vh',
    backgroundColor: '#0f0f0f',
    borderRight: '1px solid #1e1e1e',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px 12px',
    gap: '4px',
    flexShrink: 0,
    boxSizing: 'border-box' as const,
  },
  logo: {
    color: '#ffffff',
    fontFamily: "'DM Mono', monospace",
    fontSize: '15px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    padding: '0 12px',
    marginBottom: '32px',
  },
  accent: { color: '#4ade80' },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#6b7280',
    fontSize: '14px',
    fontFamily: "'DM Mono', monospace",
    transition: 'all 0.15s ease',
  },
  navLinkActive: {
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
  },
};

export default function Sidebar() {
  function handleLogout() {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        Beyond<span style={styles.accent}>Chats</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        style={{
          ...styles.navLink,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          color: '#4b5563',
          fontSize: '13px',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </aside>
  );
}
