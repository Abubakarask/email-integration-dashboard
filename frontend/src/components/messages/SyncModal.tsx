import { useState } from 'react';

const PRESETS = [7, 14, 30, 90];

export default function SyncModal({ onSync, onClose }: { onSync: (days: number) => void, onClose: () => void }) {
  const [days, setDays] = useState(30);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-7 w-80 flex flex-col gap-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="font-mono text-base font-semibold text-zinc-100">Sync Gmail Inbox</div>
        <div className="font-mono text-xs text-zinc-400 leading-relaxed">
          How many days of emails do you want to sync?
        </div>

        <div className="flex gap-2">
          {PRESETS.map(d => (
            <button
              key={d}
              className={`flex-1 font-mono text-xs rounded-lg py-2 cursor-pointer transition ${days === d ? 'bg-cyan-400/10 border border-cyan-400/30 text-cyan-400' : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-100'}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-zinc-500">Custom:</span>
          <input
            type="number"
            min="1"
            max="365"
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-mono text-sm w-full focus:outline-none focus:border-cyan-400 transition"
          />
          <span className="font-mono text-xs text-zinc-500">days</span>
        </div>

        <div className="flex gap-2.5 justify-end mt-1">
          <button 
            className="font-mono text-xs bg-transparent border border-zinc-700 text-zinc-400 rounded-lg px-4 py-2 cursor-pointer hover:text-zinc-100 transition" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="bg-cyan-400 text-black font-mono font-semibold text-xs px-5 py-2 rounded-lg hover:bg-cyan-300 transition cursor-pointer" 
            onClick={() => onSync(days)}
          >
            Start Sync
          </button>
        </div>
      </div>
    </div>
  );
}
