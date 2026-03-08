function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ThreadList({ 
  threads, 
  loading, 
  selected, 
  onSelect, 
  page, 
  meta, 
  onPageChange 
}: { 
  threads: any[], 
  loading: boolean, 
  selected: string | null, 
  onSelect: (thread: any) => void, 
  page: number, 
  meta: any, 
  onPageChange: (updater: (p: number) => number) => void 
}) {
  return (
    <div style={styles.panel}>
      {loading ? (
        <div style={styles.empty}>Loading…</div>
      ) : threads.length === 0 ? (
        <div style={styles.empty}>No threads yet. Sync your inbox.</div>
      ) : (
        <>
          <div style={styles.list}>
            {threads.map(thread => (
              <div
                key={thread.id}
                style={{
                  ...styles.item,
                  ...(selected === thread.id ? styles.itemActive : {}),
                }}
                onClick={() => onSelect(thread)}
              >
                {/* Top row: participants + date */}
                <div style={styles.itemTop}>
                  <span style={styles.participants}>
                    {(thread.participants ?? []).slice(0, 2).join(', ')}
                  </span>
                  <span style={styles.date}>{formatDate(thread.last_message_at)}</span>
                </div>

                {/* Subject */}
                <div style={styles.subject}>
                  {thread.subject || '(no subject)'}
                </div>

                {/* Snippet + message count */}
                <div style={styles.itemBottom}>
                  <span style={styles.snippet}>{thread.snippet}</span>
                  {thread.message_count > 1 && (
                    <span style={styles.msgCount}>{thread.message_count}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div style={styles.pagination}>
              <button
                style={styles.pageBtn}
                disabled={page === 1}
                onClick={() => onPageChange(p => p - 1)}
              >
                ←
              </button>
              <span style={styles.pageLabel}>{page} / {meta.last_page}</span>
              <button
                style={styles.pageBtn}
                disabled={page === meta.last_page}
                onClick={() => onPageChange(p => p + 1)}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  panel: {
    width: '320px',
    flexShrink: 0,
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  list: { flex: 1, overflowY: 'auto' as const },
  empty: {
    padding: '40px 24px',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-muted)',
    textAlign: 'center' as const,
  },
  item: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  itemActive: {
    backgroundColor: 'var(--accent-dim)',
    borderLeft: '2px solid var(--accent)',
  },
  itemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  participants: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
  },
  date: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  subject: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '4px',
  },
  itemBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snippet: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '230px',
  },
  msgCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--accent)',
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--accent-border)',
    padding: '1px 6px',
    borderRadius: '10px',
    flexShrink: 0,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '12px',
    borderTop: '1px solid var(--border)',
  },
  pageBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    background: 'none',
    border: '1px solid var(--border-mid)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 10px',
    cursor: 'pointer',
  },
  pageLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
};
