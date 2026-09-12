import { useEffect, useState, useMemo } from 'react';
import { ClipboardCheck, Search, Filter, ArrowRight } from 'lucide-react';
import { useRouter, Link } from '@/hooks/useRouter';
import { useAuth } from '@/hooks/useAuth';
import { RiskBadge, LoadingSpinner } from '@/components/ui/StatCard';
import { glassCard, buttonGhost, inputClass } from '@/lib/ui';
import { supabase } from '@/lib/supabase';
import type { Analysis, ReviewStatus } from '@/types';

interface AnalysisWithReview extends Analysis {
  review_status?: ReviewStatus;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  pending: { label: 'Pending', class: 'bg-white/[0.06] text-white/60 border-white/10' },
  under_review: { label: 'Under Review', class: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  confirmed_suspicious: { label: 'Confirmed Suspicious', class: 'bg-red-500/10 text-red-400 border-red-500/30' },
  marked_safe: { label: 'Marked Safe', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  needs_more_evidence: { label: 'Needs More Evidence', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
};

export function ReviewQueuePage() {
  const { role } = useAuth();
  const { navigate } = useRouter();
  const [analyses, setAnalyses] = useState<AnalysisWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('highest');

  useEffect(() => {
    (async () => {
      const { data: analysisData } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!analysisData) { setLoading(false); return; }

      const analysisIds = analysisData.map((a) => a.id);
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('analysis_id, status')
        .in('analysis_id', analysisIds);

      const reviewMap = new Map<string, ReviewStatus>();
      reviewData?.forEach((r) => reviewMap.set(r.analysis_id, r.status as ReviewStatus));

      const enriched = analysisData.map((a) => ({
        ...a,
        review_status: reviewMap.get(a.id) ?? ('pending' as ReviewStatus),
      })) as AnalysisWithReview[];

      setAnalyses(enriched);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = analyses;
    if (search) {
      result = result.filter((a) => a.identifier.toLowerCase().includes(search.toLowerCase()));
    }
    if (riskFilter !== 'all') result = result.filter((a) => a.risk_level === riskFilter);
    if (typeFilter !== 'all') result = result.filter((a) => a.analysis_type === typeFilter);
    if (statusFilter !== 'all') result = result.filter((a) => a.review_status === statusFilter);
    if (sortBy === 'highest') {
      result = [...result].sort((a, b) => b.risk_score - a.risk_score);
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return result;
  }, [analyses, search, riskFilter, typeFilter, statusFilter, sortBy]);

  if (loading) return <LoadingSpinner size={32} />;

  if (role !== 'reviewer' && role !== 'admin') {
    return (
      <div className={glassCard('p-12 text-center')}>
        <ClipboardCheck size={32} className="text-white/20 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-white/50 mb-4">Only reviewers and admins can access the review queue.</p>
        <Link to="/dashboard" className={buttonGhost()}>Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardCheck size={24} className="text-cyan-400" /> Review Queue
        </h1>
        <p className="text-sm text-white/40 mt-1">Analyses awaiting human review — AI recommends, reviewers decide</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" placeholder="Search by identifier..." value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass('pl-10')} />
        </div>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400/50 flex-1 sm:flex-none min-w-[130px]">
          <option value="all">All Risk Levels</option>
          <option value="Critical">Critical</option>
          <option value="High Risk">High Risk</option>
          <option value="Medium Risk">Medium Risk</option>
          <option value="Low Risk">Low Risk</option>
          <option value="Trusted">Trusted</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400/50 flex-1 sm:flex-none min-w-[110px]">
          <option value="all">All Types</option>
          <option value="profile">Profile</option>
          <option value="content">Content</option>
          <option value="url">URL</option>
          <option value="media">Media</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400/50 flex-1 sm:flex-none min-w-[130px]">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="confirmed_suspicious">Confirmed Suspicious</option>
          <option value="marked_safe">Marked Safe</option>
          <option value="needs_more_evidence">Needs More Evidence</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400/50 flex-1 sm:flex-none min-w-[120px]">
          <option value="highest">Highest Risk</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={glassCard('p-12 text-center')}>
          <Filter size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No analyses match your filters.</p>
        </div>
      ) : (
        <div className={glassCard('overflow-hidden')}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-white/40 border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Identifier</th>
                  <th className="text-left py-3 px-4 font-medium">Risk Score</th>
                  <th className="text-left py-3 px-4 font-medium">Risk Level</th>
                  <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Review Status</th>
                  <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Date</th>
                  <th className="text-right py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const sc = statusLabels[a.review_status ?? 'pending'] || statusLabels.pending;
                  return (
                    <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4"><span className="text-xs uppercase text-white/50 px-2 py-0.5 rounded bg-white/[0.04]">{a.analysis_type}</span></td>
                      <td className="py-3 px-4 text-white/70 max-w-[240px] truncate">{a.identifier}</td>
                      <td className="py-3 px-4"><span className="tabular-nums font-bold" style={{ color: a.risk_score >= 61 ? '#f87171' : a.risk_score >= 41 ? '#fbbf24' : '#34d399' }}>{a.risk_score}/100</span></td>
                      <td className="py-3 px-4"><RiskBadge level={a.risk_level} /></td>
                      <td className="py-3 px-4 hidden md:table-cell"><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${sc.class}`}>{sc.label}</span></td>
                      <td className="py-3 px-4 text-white/40 text-xs hidden lg:table-cell">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right"><button onClick={() => navigate(`/review/${a.id}`)} className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">Review <ArrowRight size={12} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
