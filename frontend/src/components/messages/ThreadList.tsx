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
  onSelect: (threadId: string) => void, 
  page: number, 
  meta: any, 
  onPageChange: (updater: (p: number) => number) => void 
}) {
  return (
    <>
      {loading ? (
        <div className="flex-1 overflow-y-auto w-full">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="px-4 py-3.5 border-b border-zinc-800 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-3 bg-zinc-800 rounded w-28" />
                <div className="h-2.5 bg-zinc-800 rounded w-10" />
              </div>
              <div className="h-3.5 bg-zinc-800 rounded w-4/5 mb-2 mt-1" />
              <div className="h-3 bg-zinc-800 rounded w-[95%]" />
            </div>
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 font-mono text-xs text-zinc-500 text-center w-full">
          No threads yet. Sync your inbox.
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto w-full">
            {threads.map(thread => (
              <div
                key={thread.id}
                className={`px-4 py-3.5 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition ${selected === thread.id ? 'bg-cyan-400/5 border-l-2 border-l-cyan-400' : 'border-l-2 border-l-transparent'}`}
                onClick={() => onSelect(thread.id)}
              >
                {/* Top row: participants + date */}
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-xs font-semibold text-zinc-100 truncate pr-2">
                    {(thread.participants ?? []).slice(0, 2).join(', ')}
                  </span>
                  <span className="font-mono text-xs text-zinc-600 shrink-0">{formatDate(thread.last_message_at)}</span>
                </div>

                {/* Subject */}
                <div className="text-sm font-medium text-zinc-200 truncate mt-0.5">
                  {thread.subject || '(no subject)'}
                </div>

                {/* Snippet + message count */}
                <div className="flex justify-between items-center mt-1 gap-2">
                  <span className="font-mono text-xs text-zinc-500 truncate">{thread.snippet}</span>
                  {thread.message_count > 1 && (
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                      {thread.message_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-3 p-3 border-t border-zinc-800 w-full shrink-0">
              <button
                className="font-mono text-xs bg-transparent border border-zinc-700 text-zinc-400 rounded px-2.5 py-1 cursor-pointer hover:text-zinc-200 hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={page === 1}
                onClick={() => onPageChange(p => p - 1)}
              >
                ←
              </button>
              <span className="font-mono text-[11px] text-zinc-600">{page} / {meta.last_page}</span>
              <button
                className="font-mono text-xs bg-transparent border border-zinc-700 text-zinc-400 rounded px-2.5 py-1 cursor-pointer hover:text-zinc-200 hover:border-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={page === meta.last_page}
                onClick={() => onPageChange(p => p + 1)}
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
