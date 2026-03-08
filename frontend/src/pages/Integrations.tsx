import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

function GmailLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#f1f3f4"/>
      <path d="M20 4L12 13 4 4" stroke="#EA4335" strokeWidth="2"/>
      <path d="M2 6l10 7 10-7" fill="none" stroke="#34A853" strokeWidth="0"/>
      <path d="M4 4l8 9 8-9H4z" fill="#EA4335"/>
      <path d="M2 6v12l5-6-5-6z" fill="#4285F4"/>
      <path d="M22 6v12l-5-6 5-6z" fill="#FBBC05"/>
      <path d="M17 12l5 6H2l5-6 5 7 5-7z" fill="#34A853"/>
    </svg>
  );
}

import { useGmailStatusQuery, useConnectGmailMutation, useDisconnectGmailMutation } from '../app/data/google';

export default function Integrations() {
  const [searchParams] = useSearchParams();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data, isLoading } = useGmailStatusQuery();
  const connectMutation = useConnectGmailMutation();
  const disconnectMutation = useDisconnectGmailMutation();

  const status = data?.status || 'not_connected';
  const email = data?.google_user_email;

  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      showToast('Gmail connected successfully!', 'success');
      window.history.replaceState({}, '', '/integrations');
    }
    if (searchParams.get('error')) {
      showToast('Failed to connect Gmail. Please try again.', 'error');
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams]);

  async function handleConnect() {
    try {
      const res = await connectMutation.mutateAsync();
      window.location.href = res.auth_url; // redirect to Google OAuth
    } catch (err) {
      showToast('Could not initiate Gmail connection.', 'error');
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectMutation.mutateAsync();
      showToast('Gmail disconnected.', 'success');
    } catch (err) {
      showToast('Failed to disconnect.', 'error');
    }
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  return (
    <div className="p-8 bg-zinc-950 min-h-screen">
      {toast && (
        <div className={`fixed top-6 right-6 px-4 py-3 rounded-lg text-sm font-mono z-50 border ${toast.type === 'success' ? 'bg-emerald-950 border-emerald-900 text-emerald-400' : 'bg-red-950 border-red-900 text-red-400'}`}>
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-semibold mb-2 text-zinc-100 font-sans tracking-tight">Integrations</h1>
      <p className="text-sm text-zinc-400 mb-10 font-sans">Connect your accounts to sync and manage emails.</p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
            <GmailLogo />
          </div>
          <div>
            <div className="font-semibold text-zinc-100 font-sans text-sm">Gmail</div>
            <div className="text-xs text-zinc-500 font-sans">Sync your inbox and reply to threads.</div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3 mt-2 animate-pulse">
            <div className="h-3 bg-zinc-800 rounded w-3/5" />
            <div className="h-9 bg-zinc-800 rounded-lg w-32" />
          </div>
        ) : status === 'connected' ? (
          <>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-mono px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Connected
              </div>
              <span className="text-xs text-zinc-500 font-mono">{email}</span>
            </div>
            <button onClick={handleDisconnect} disabled={disconnectMutation.isPending} className="self-start text-red-400 border border-zinc-700 text-xs px-3 py-2 rounded-lg hover:border-red-800 transition font-mono">
              Disconnect
            </button>
          </>
        ) : (
          <>
            <div className="text-sm text-zinc-500 font-sans leading-relaxed">
              Connect your Gmail account to sync emails and reply to threads directly from this dashboard.
            </div>
            <button onClick={handleConnect} disabled={connectMutation.isPending} className="self-start flex items-center gap-2 bg-white text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-zinc-100 transition font-sans">
              <GmailLogo />
              Connect Gmail
            </button>
          </>
        )}
      </div>
    </div>
  );
}
