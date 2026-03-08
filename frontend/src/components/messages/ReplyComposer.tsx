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
    <div className="border-t border-zinc-800 bg-zinc-900 px-6 py-4 shrink-0">
      <div className="font-mono text-xs text-zinc-600 uppercase tracking-widest mb-2">Reply</div>
      <textarea
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 text-sm px-4 py-3 resize-none focus:outline-none focus:border-cyan-400 transition"
        placeholder="Write your reply… (⌘↵ to send)"
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={4}
      />
      {error && <div className="font-mono text-xs text-red-500 mt-2">{error}</div>}
      <div className="flex justify-between items-center mt-3">
        <span className="font-mono text-[10px] text-zinc-500">⌘↵ to send</span>
        <button
          className="bg-cyan-400 text-black font-mono font-semibold text-xs px-4 py-2 rounded-lg hover:bg-cyan-300 disabled:opacity-40 transition cursor-pointer"
          onClick={handleSend}
          disabled={sending || !body.trim()}
        >
          {sending ? 'Sending…' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
}
