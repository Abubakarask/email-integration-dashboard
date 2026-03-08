import { useEffect, useState } from 'react';
import { apiClient as api } from '../app/data/auth/api';
import { Mail, MessageSquare, Send, Clock, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-10 bg-zinc-950 min-h-screen text-zinc-100 font-mono">
        <h1 className="text-2xl font-semibold mb-2 text-zinc-100 p-0 m-0 leading-none tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-400 mb-8 font-sans">Overview and statistics for your email integration.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 animate-pulse h-36">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 mb-2"></div>
              <div className="w-3/5 h-3.5 bg-zinc-800 rounded"></div>
              <div className="w-4/5 h-7 bg-zinc-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stats?.status === 'not_connected') {
    return (
      <div className="p-10 bg-zinc-950 min-h-screen text-zinc-100 font-mono flex items-center justify-center">
        <div className="text-center bg-zinc-900 p-16 rounded-2xl border border-dashed border-zinc-800 max-w-md w-full">
          <AlertCircle size={40} className="text-zinc-500 mx-auto mb-4" />
          <h2 className="text-xl text-zinc-100 mb-2 font-semibold">Gmail Not Connected</h2>
          <p className="text-sm text-zinc-400 mb-6 font-sans leading-relaxed">You need to connect your Gmail account to see statistics.</p>
          <a href="/integrations" className="inline-block bg-zinc-200 text-black px-5 py-2.5 rounded-lg no-underline font-semibold text-sm transition hover:bg-white font-sans">
            Go to Integrations
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 bg-zinc-950 min-h-screen text-zinc-100 font-mono">
      <h1 className="text-2xl font-semibold mb-2 text-zinc-100 p-0 m-0 leading-none tracking-tight">Dashboard</h1>
      <p className="text-sm text-zinc-400 mb-8 font-sans">Overview and statistics for <strong className="text-zinc-200">{stats?.google_user_email}</strong>.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-500">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-400/10 text-sky-400">
              <Mail size={20} />
            </div>
            <span className="text-sm text-zinc-400 font-medium">Total Threads</span>
          </div>
          <div className="text-3xl font-bold text-zinc-100 tracking-tight font-sans">{stats?.stats?.threads ?? 0}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-500">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400">
              <MessageSquare size={20} />
            </div>
            <span className="text-sm text-zinc-400 font-medium">Total Messages</span>
          </div>
          <div className="text-3xl font-bold text-zinc-100 tracking-tight font-sans">{stats?.stats?.messages ?? 0}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-500">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-400/10 text-violet-400">
              <Send size={20} />
            </div>
            <span className="text-sm text-zinc-400 font-medium">Sent Replies</span>
          </div>
          <div className="text-3xl font-bold text-zinc-100 tracking-tight font-sans">{stats?.stats?.sent_messages ?? 0}</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-500">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-400/10 text-orange-400">
              <Clock size={20} />
            </div>
            <span className="text-sm text-zinc-400 font-medium">Last Synced</span>
          </div>
          <div className="text-lg font-medium text-zinc-300 mt-auto font-sans tracking-tight">
            {stats?.stats?.last_synced_at ? new Date(stats.stats.last_synced_at).toLocaleString() : 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
}
