import { useState } from 'react';

export default function ReplyComposer({ onSend }: { onSend: (body: string) => Promise<void> }) {
  const [body, setBody]       = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      // Wrap plain text in <p> tags before sending
      const html = body
        .split('\n')
        .filter(Boolean)
        .map(line => `<p>${line}</p>`)
        .join('');
      await onSend(html);
      setBody('');
    } catch (e) {
      setError('Failed to send. Try again.');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd+Enter or Ctrl+Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend();
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.label}>Reply</div>
      <textarea
        style={styles.textarea as any}
        placeholder="Write your reply… (⌘↵ to send)"
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={4}
      />
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.footer}>
        <span style={styles.hint}>⌘↵ to send</span>
        <button
          style={{ ...styles.sendBtn, opacity: sending ? 0.6 : 1 }}
          onClick={handleSend}
          disabled={sending || !body.trim()}
        >
          {sending ? 'Sending…' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    borderTop: '1px solid var(--border)',
    padding: '16px 28px 20px',
    flexShrink: 0,
    backgroundColor: 'var(--bg-panel)',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  textarea: {
    width: '100%',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '12px 14px',
    resize: 'vertical' as const,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  error: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: '#f87171',
    marginTop: '6px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
  },
  hint: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  sendBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 18px',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
};
