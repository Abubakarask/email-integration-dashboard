import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ReplyComposer from './ReplyComposer';
import { apiClient as api } from '../../app/data/auth/api';

export default function ThreadDetail({ thread, onReply }: { thread: any, onReply: () => void }) {
  const [detail, setDetail]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!thread) { setDetail(null); return; }
    loadThread(thread.id);
  }, [thread?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages]);

  async function loadThread(id: string) {
    setLoading(true);
    try {
      const res = await api.get(`/threads/${id}`);
      setDetail(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(body: string) {
    await api.post(`/threads/${thread.id}/reply`, { body });
    await loadThread(thread.id);   // refresh thread after reply
    onReply?.();
  }

  if (!thread) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>✉</div>
        <div style={styles.emptyText}>Select a thread to read</div>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.loading}>Loading thread…</div>;
  }

  return (
    <div style={styles.panel}>
      {/* Thread header */}
      <div style={styles.header}>
        <div style={styles.subject}>{detail?.subject || '(no subject)'}</div>
        <div style={styles.meta}>
          {detail?.participants?.join(' · ')} · {detail?.message_count} messages
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {(detail?.messages ?? []).map((msg: any) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply composer always at bottom */}
      <ReplyComposer onSend={handleReply} />
    </div>
  );
}

const styles = {
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  emptyIcon: { fontSize: '32px', opacity: 0.2 },
  emptyText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  header: {
    padding: '20px 28px 16px',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  subject: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  meta: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  messages: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px 28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
};
