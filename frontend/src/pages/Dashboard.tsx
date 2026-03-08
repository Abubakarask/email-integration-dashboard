const styles = {
  page: {
    padding: '40px',
    backgroundColor: '#0a0a0a',
    minHeight: '100vh',
    color: '#ffffff',
    fontFamily: "'DM Mono', monospace",
  },
  heading: { fontSize: '22px', fontWeight: '600', marginBottom: '8px' },
  sub: { fontSize: '13px', color: '#4b5563' },
};

export default function Dashboard() {
  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Dashboard</h1>
      <p style={styles.sub}>Overview and stats will appear here.</p>
    </div>
  );
}
