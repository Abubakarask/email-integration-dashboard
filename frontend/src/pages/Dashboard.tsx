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
      <div className="dashboard-page">
        <h1 className="heading">Dashboard</h1>
        <p className="subheading">Overview and statistics for your email integration.</p>
        <div className="grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card skeleton-card">
              <div className="skeleton-icon"></div>
              <div className="skeleton-line title"></div>
              <div className="skeleton-line value"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stats?.status === 'not_connected') {
    return (
      <div className="dashboard-page flex-center">
        <div className="empty-state">
          <AlertCircle size={40} className="empty-icon" />
          <h2>Gmail Not Connected</h2>
          <p>You need to connect your Gmail account to see statistics.</p>
          <a href="/integrations" className="connect-link">Go to Integrations</a>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <h1 className="heading">Dashboard</h1>
      <p className="subheading">Overview and statistics for <strong>{stats?.google_user_email}</strong>.</p>
      
      <div className="grid">
        <div className="card">
          <div className="card-header">
            <Mail className="card-icon blue" size={20} />
            <span className="card-title">Total Threads</span>
          </div>
          <div className="card-value">{stats?.stats?.threads ?? 0}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <MessageSquare className="card-icon green" size={20} />
            <span className="card-title">Total Messages</span>
          </div>
          <div className="card-value">{stats?.stats?.messages ?? 0}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <Send className="card-icon purple" size={20} />
            <span className="card-title">Sent Replies</span>
          </div>
          <div className="card-value">{stats?.stats?.sent_messages ?? 0}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <Clock className="card-icon orange" size={20} />
            <span className="card-title">Last Synced</span>
          </div>
          <div className="card-value date">
            {stats?.stats?.last_synced_at ? new Date(stats.stats.last_synced_at).toLocaleString() : 'Never'}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-page {
          padding: 40px;
          background-color: #0d1117;
          min-height: 100vh;
          color: #c9d1d9;
          font-family: 'DM Mono', monospace;
        }
        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .heading {
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #f0f6fc;
        }
        .subheading {
          font-size: 14px;
          color: #8b949e;
          margin-bottom: 32px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
        }
        .card {
          background-color: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.2s, border-color 0.2s;
        }
        .card:hover {
          transform: translateY(-2px);
          border-color: #8b949e;
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .card-title {
          font-size: 14px;
          color: #8b949e;
          font-weight: 500;
        }
        .card-value {
          font-size: 32px;
          font-weight: 700;
          color: #f0f6fc;
          letter-spacing: -1px;
        }
        .card-value.date {
          font-size: 18px;
          font-weight: 500;
          color: #c9d1d9;
          letter-spacing: 0;
          margin-top: auto;
        }
        .card-icon { padding: 8px; border-radius: 8px; }
        .blue { background: rgba(56, 189, 248, 0.1); color: #38bdf8; }
        .green { background: rgba(52, 211, 153, 0.1); color: #34d399; }
        .purple { background: rgba(167, 139, 250, 0.1); color: #a78bfa; }
        .orange { background: rgba(251, 146, 60, 0.1); color: #fb923c; }

        .empty-state {
          text-align: center;
          background: #161b22;
          padding: 60px;
          border-radius: 16px;
          border: 1px dashed #30363d;
          max-width: 400px;
        }
        .empty-icon {
          color: #8b949e;
          margin-bottom: 16px;
        }
        .empty-state h2 {
          color: #f0f6fc;
          margin-bottom: 8px;
          font-size: 20px;
        }
        .empty-state p {
          color: #8b949e;
          margin-bottom: 24px;
          font-size: 14px;
          line-height: 1.5;
        }
        .connect-link {
          display: inline-block;
          background: #e5e7eb;
          color: #0a0a0a;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: background 0.2s;
        }
        .connect-link:hover {
          background: #ffffff;
        }

        /* Skeleton animations */
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton-card {
          height: 140px;
        }
        .skeleton-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #21262d;
          margin-bottom: 16px;
        }
        .skeleton-line {
          background: #21262d;
          background-image: linear-gradient(90deg, #21262d 0px, #30363d 40px, #21262d 80px);
          background-size: 600px;
          animation: shimmer 2s infinite linear;
          border-radius: 4px;
        }
        .skeleton-line.title {
          width: 60%;
          height: 14px;
          margin-bottom: 8px;
        }
        .skeleton-line.value {
          width: 80%;
          height: 28px;
        }
      `}</style>
    </div>
  );
}
