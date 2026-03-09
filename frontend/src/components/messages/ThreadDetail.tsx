import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ReplyComposer from './ReplyComposer';
import { apiClient as api } from '../../app/data/auth/api';
import { PRIORITY_CONFIG } from './ThreadList'; // To reuse PRIORITY_CONFIG

export default function ThreadDetail({ thread, onReply, onBack }: { thread: any, onReply: () => void, onBack: () => void }) {
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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-600 font-mono text-sm w-full">
        <div className="text-3xl opacity-20">✉</div>
        <div>Select a thread to read</div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center font-mono text-xs text-zinc-500 w-full animate-pulse">Loading thread…</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden w-full">
      {/* Mobile back button */}
      <div className="md:hidden px-6 pt-4 shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 font-mono text-xs cursor-pointer bg-transparent border-none p-0"
        >
          ← Back to threads
        </button>
      </div>

      {/* Thread header */}
      <div className="px-6 py-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-base font-semibold text-zinc-100">{detail?.subject || '(no subject)'}</div>
          {detail?.priority && (
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded-full border shrink-0"
              style={{
                color: PRIORITY_CONFIG[detail.priority]?.color,
                backgroundColor: PRIORITY_CONFIG[detail.priority]?.bg,
                borderColor: PRIORITY_CONFIG[detail.priority]?.color + '40',
              }}
            >
              {PRIORITY_CONFIG[detail.priority]?.label}
            </span>
          )}
        </div>
        <div className="font-mono text-xs text-zinc-500 mt-1">
          {detail?.participants?.join(' · ')} · {detail?.message_count} messages
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
