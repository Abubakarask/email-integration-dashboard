export default function MessageBubble({ message }: { message: any }) {
  const isSent = message.is_sent;

  const toList = (message.to ?? [])
    .map((r: any) => r.name ? `${r.name} <${r.email}>` : r.email)
    .join(', ');

  return (
    <div style={{ ...styles.bubble, ...(isSent ? styles.sent : styles.received) }}>
      {/* Message header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.avatar}>
            {(message.from_name || message.from_email)?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={styles.fromName}>
              {message.from_name || message.from_email}
              {isSent && <span style={styles.sentLabel}>You</span>}
            </div>
            <div style={styles.fromEmail}>
              {message.from_email} → {toList}
            </div>
          </div>
        </div>
        <div style={styles.time}>
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
          style={styles.iframe}
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
        <div style={styles.attachments}>
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
    <button style={styles.chip} onClick={handleDownload}>
      <span style={styles.chipIcon}>📎</span>
      <span style={styles.chipName}>{attachment.filename}</span>
    </button>
  );
}

const styles = {
  bubble: {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },
  received: { backgroundColor: 'var(--bg-elevated)' },
  sent: {
    backgroundColor: 'var(--sent-bg)',
    borderColor: 'var(--sent-border)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-hover)',
    border: '1px solid var(--border-mid)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--accent)',
    flexShrink: 0,
  },
  fromName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sentLabel: {
    fontSize: '10px',
    backgroundColor: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid var(--accent-border)',
    padding: '1px 6px',
    borderRadius: '10px',
  },
  fromEmail: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  time: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  iframe: {
    width: '100%',
    border: 'none',
    display: 'block',
    minHeight: '60px',
    padding: '0 16px',
    backgroundColor: 'transparent',
  },
  attachments: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    padding: '10px 16px',
    borderTop: '1px solid var(--border)',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-hover)',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 10px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
  },
  chipIcon: { fontSize: '12px' },
  chipName: { maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
