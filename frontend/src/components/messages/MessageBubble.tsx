export default function MessageBubble({ message }: { message: any }) {
  const isSent = message.is_sent;

  const toList = (message.to ?? [])
    .map((r: any) => r.name ? `${r.name} <${r.email}>` : r.email)
    .join(', ');

  return (
    <div className={`rounded-xl border overflow-hidden flex-shrink-0 ${isSent ? 'bg-cyan-400/5 border-cyan-400/20' : 'bg-zinc-900 border-zinc-800'}`}>
      {/* Message header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-xs font-bold text-cyan-400 shrink-0">
            {(message.from_name || message.from_email)?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-zinc-100">
                {message.from_name || message.from_email}
              </span>
              {isSent && (
                <span className="font-mono text-[10px] bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
              {message.from_email} → {toList}
            </div>
          </div>
        </div>
        <div className="font-mono text-[10px] text-zinc-600 shrink-0">
          {message.sent_at
            ? new Date(message.sent_at).toLocaleString([], {
                month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })
            : ''}
        </div>
      </div>

      {/* Email body — rendered in sandboxed iframe to prevent CSS bleed */}
      {message.body_html && (
        <iframe
          srcDoc={`
            <html>
              <head>
                <style>
                  * { box-sizing: border-box; }
                  body {
                    font-family: 'IBM Plex Sans', -apple-system, sans-serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #e2e8f0;
                    background: transparent;
                    margin: 0;
                    padding: 0;
                    word-break: break-word;
                  }
                  a { color: #22d3ee; }
                  img { max-width: 100%; }
                  pre { white-space: pre-wrap; }
                </style>
              </head>
              <body>${message.body_html}</body>
            </html>
          `}
          className="w-full border-none block min-h-[60px] px-4 bg-transparent mt-2"
          sandbox="allow-same-origin"
          scrolling="no"
          onLoad={(e: any) => {
            // Auto-resize iframe to content height
            const doc = e.target.contentDocument;
            if (doc?.body) {
              e.target.style.height = doc.body.scrollHeight + 'px';
            }
          }}
        />
      )}

      {/* Attachments */}
      {message.attachments?.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-zinc-800">
          {message.attachments.map((att: any, i: number) => (
            <AttachmentChip
              key={i}
              messageId={message.id}
              attachment={att}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentChip({ messageId, attachment }: { messageId: number, attachment: any }) {
  async function handleDownload() {
    const url = `/api/attachments/${messageId}/${attachment.attachmentId}`;
    const token = localStorage.getItem('access_token');
    const res = await fetch(`http://localhost:8000${url}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = attachment.filename;
    link.click();
  }

  return (
    <button 
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs font-mono text-zinc-300 cursor-pointer hover:border-zinc-500 transition"
    >
      <span className="text-xs">📎</span>
      <span className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
        {attachment.filename}
      </span>
    </button>
  );
}
