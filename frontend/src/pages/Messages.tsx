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
  const [meta, setMeta]                 = useState<any>(null);
  const [showDetail, setShowDetail]     = useState(false);

  useEffect(() => { fetchThreads(); }, [page]);

  async function fetchThreads() {
    try {
      setLoading(true);
      const res = await api.get(`/threads?page=${page}&per_page=25`);
      setThreads(res.data.data ?? []);
      setMeta(res.data);
    } catch (err: any) {
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
      
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await api.get('/gmail/sync-status');
          
          if (statusRes.data.status === 'completed') {
            clearInterval(pollInterval);
            setSyncing(false);
            await fetchThreads();
          } else if (statusRes.data.status === 'failed') {
            clearInterval(pollInterval);
            setSyncing(false);
          }

          if (attempts > 30) {
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

  const handleSelectThread = (threadId: string) => {
    setSelected(threadId);
    setShowDetail(true);
  };

  const handleBack = () => {
    setShowDetail(false);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-semibold text-zinc-100">Messages</span>
          {meta && (
            <span className="font-mono text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
              {meta.total ?? 0} threads
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {syncing && <span className="font-mono text-xs text-cyan-400 animate-pulse">⟳ Syncing…</span>}
          <button 
            className="font-mono text-xs font-semibold bg-cyan-400 text-black border-none rounded-lg px-3.5 py-2 cursor-pointer transition hover:bg-cyan-300" 
            onClick={() => setShowSyncModal(true)}
          >
            Sync Inbox
          </button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className={`${showDetail ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0 border-r border-zinc-800 flex-col`}>
          <ThreadList
            threads={threads}
            loading={loading}
            selected={selectedThread}
            onSelect={handleSelectThread}
            page={page}
            meta={meta}
            onPageChange={setPage}
          />
        </div>
        
        {/* Right Panel */}
        <div className={`${!showDetail ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-hidden`}>
          <ThreadDetail
            thread={threads.find(t => t.id === selectedThread)}
            onReply={fetchThreads}
            onBack={handleBack}
          />
        </div>
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
