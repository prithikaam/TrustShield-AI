import { useEffect, useState } from 'react';
import { History, Eye, Trash2, AlertCircle } from 'lucide-react';
import { Link, useRouter } from '@/hooks/useRouter';
import { useAuth } from '@/hooks/useAuth';
import { RiskBadge, LoadingSpinner } from '@/components/ui/StatCard';
import { glassCard, buttonGhost, buttonDanger } from '@/lib/ui';
import { fetchUserAnalyses } from '@/services/analysisService';
import { supabase } from '@/lib/supabase';
import type { Analysis } from '@/types';

export function TrustHistoryPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!user) return;
    fetchUserAnalyses(user.id, 200).then((data) => {
      setAnalyses(data);
      setLoading(false);
    });
  }, [user]);

  const filtered = analyses
    .filter((a) => filter === 'all' || a.analysis_type === filter)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'highest') return b.risk_score - a.risk_score;
      return 0;
    });

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this analysis? This cannot be undone.')) return;
    await supabase.from('analyses').delete().eq('id', id);
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) return <LoadingSpinner size={32} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <History size={24} className="text-cyan-400" /> Trust History
        </h1>
        <p className="text-sm text-white/40 mt-1">All your past analyses and trust assessments</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400/50 flex-1 sm:flex-none min-w-[120px]"
        >
          <option value="all">All Types</option>
          <option value="profile">Profile</option>
          <option value="content">Content</option>
          <option value="url">URL</option>
          <option value="media">Media</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400/50 flex-1 sm:flex-none min-w-[120px]"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Risk</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={glassCard('p-12 text-center')}>
          <History size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No analyses found.</p>
          <Link to="/analyzer/profile" className={`${buttonGhost()} mt-4`}>Start Analyzing</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className={glassCard('p-4 flex items-center gap-2 sm:gap-4 group hover:border-white/[0.12] transition-all')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs uppercase text-white/40 px-2 py-0.5 rounded bg-white/[0.04]">{a.analysis_type}</span>
                  <RiskBadge level={a.risk_level} />
                </div>
                <div className="text-sm text-white/80 truncate">{a.identifier}</div>
                <div className="text-xs text-white/30 mt-0.5 hidden sm:block">{new Date(a.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-base sm:text-lg font-bold tabular-nums text-white">{a.trust_score}<span className="text-xs text-white/30">/100</span></div>
                <div className="text-[10px] sm:text-xs text-white/40">Trust</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => navigate(`/analysis/${a.id}`)}
                  className="p-2 rounded-lg text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                  title="View"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
