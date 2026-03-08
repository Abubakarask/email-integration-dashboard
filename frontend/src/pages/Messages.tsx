import { useState, useEffect } from 'react';
import ThreadList from '../components/messages/ThreadList';
import ThreadDetail from '../components/messages/ThreadDetail';
import SyncModal from '../components/messages/SyncModal';
import { apiClient as api } from '../app/data/auth/api';

export default function Messages() {
  const [threads, setThreads]           = useState<any[]>([]);
  const [selectedThread, setSelected]   = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncing, setSyncing]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [meta, setMeta]                 = useState<any>(null);   // pagination meta

  useEffect(() => { fetchThreads(); }, [page]);

  async function fetchThreads() {
    try {
      setLoading(true);
      const res = await api.get(`/threads?page=${page}&per_page=25`);
      setThreads(res.data.data ?? []);
      setMeta(res.data);
    } catch (err: any) {
      // Gmail not connected → show sync prompt
      if (err.response?.status === 400) setShowSyncModal(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(days: number) {
    setSyncing(true);
    setShowSyncModal(false);
    try {
      await api.post('/gmail/sync', { days });
      
      // Actively poll the backend job status every 3 seconds while the background queue runs
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await api.get('/gmail/sync-status');
          
          if (statusRes.data.status === 'completed') {
            clearInterval(pollInterval);
            setSyncing(false);
            // Single explicit pull now that sync is perfectly complete
            await fetchThreads();
          } else if (statusRes.data.status === 'failed') {
            clearInterval(pollInterval);
            setSyncing(false);
            // Handle fail state (Optional logging here)
          }

          if (attempts > 30) {
            // timeout after 90 seconds
            clearInterval(pollInterval);
            setSyncing(false);
          }
        } catch (e) {
          // Silent catch on poll fails
        }
      }, 3000);
      
    } catch (err: any) {
      setSyncing(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.title}>Messages</span>
          {meta && (
            <span style={styles.count}>{meta.total ?? 0} threads</span>
          )}
        </div>
        <div style={styles.headerRight}>
          {syncing && <span style={styles.syncingBadge}>⟳ Syncing…</span>}
          <button style={styles.syncBtn} onClick={() => setShowSyncModal(true)}>
            Sync Inbox
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={styles.panels}>
        <ThreadList
          threads={threads}
          loading={loading}
          selected={selectedThread?.id}
          onSelect={setSelected}
          page={page}
          meta={meta}
          onPageChange={setPage}
        />
        <ThreadDetail
          thread={selectedThread}
          onReply={fetchThreads}
        />
      </div>

      {showSyncModal && (
        <SyncModal
          onSync={handleSync}
          onClose={() => setShowSyncModal(false)}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    backgroundColor: 'var(--bg-base)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  count: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  syncingBadge: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--accent)',
    animation: 'pulse 1.5s infinite',
  },
  syncBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '7px 14px',
    cursor: 'pointer',
  },
  panels: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
};
