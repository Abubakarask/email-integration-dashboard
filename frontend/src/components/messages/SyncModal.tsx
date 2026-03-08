import { useState } from 'react';

const PRESETS = [7, 14, 30, 90];

export default function SyncModal({ onSync, onClose }: { onSync: (days: number) => void, onClose: () => void }) {
  const [days, setDays] = useState(30);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.title}>Sync Gmail Inbox</div>
        <div style={styles.desc}>
          How many days of emails do you want to sync?
        </div>

        <div style={styles.presets}>
          {PRESETS.map(d => (
            <button
              key={d}
              style={{ ...styles.preset, ...(days === d ? styles.presetActive : {}) }}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>

        <div style={styles.customRow}>
          <span style={styles.customLabel}>Custom:</span>
          <input
            type="number"
            min="1"
            max="365"
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={styles.input as any}
          />
          <span style={styles.customLabel}>days</span>
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.confirmBtn} onClick={() => onSync(days)}>
            Start Sync
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const, inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius-md)',
    padding: '28px',
    width: '340px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  desc: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  presets: { display: 'flex', gap: '8px' },
  preset: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    flex: 1,
    padding: '8px',
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  presetActive: {
    backgroundColor: 'var(--accent-dim)',
    borderColor: 'var(--accent-border)',
    color: 'var(--accent)',
  },
  customRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  customLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  input: {
    flex: 1,
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    padding: '7px 10px',
    outline: 'none',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '4px',
  },
  cancelBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-mid)',
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 16px',
    cursor: 'pointer',
  },
  confirmBtn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 18px',
    cursor: 'pointer',
  },
};
