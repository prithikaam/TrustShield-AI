import { useEffect, useState } from 'react';
import {
  ArrowLeft, ShieldAlert, Brain, Eye, ClipboardCheck, Printer,
  CheckCircle2, AlertTriangle, Info, Zap,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { useRouter, Link } from '@/hooks/useRouter';
import { useAuth } from '@/hooks/useAuth';
import { TrustScoreDisplay } from '@/components/ui/TrustScoreDisplay';
import { SignalList } from '@/components/ui/SignalList';
import { RiskBadge, LoadingSpinner } from '@/components/ui/StatCard';
import { glassCard, buttonPrimary, buttonGhost } from '@/lib/ui';
import { computeCategoryScores } from '@/lib/risk-utils';
import {
  fetchAnalysisById, fetchRiskSignals, fetchProfileById,
  fetchContentAnalysis, fetchUrlAnalysis, fetchMediaAnalysis,
  fetchReviewsForAnalysis,
} from '@/services/analysisService';
import type { Analysis, RiskSignal, AnalyzedProfile } from '@/types';

const categoryLabels: Record<string, string> = {
  identity: 'Identity',
  behavioral: 'Behavior',
  content: 'Content',
  url: 'URL',
  media: 'Media',
};

export function AnalysisResultPage({ analysisId }: { analysisId: string }) {
  const { navigate } = useRouter();
  const { role } = useAuth();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [signals, setSignals] = useState<RiskSignal[]>([]);
  const [profile, setProfile] = useState<AnalyzedProfile | null>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [urlData, setUrlData] = useState<any>(null);
  const [mediaData, setMediaData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const a = await fetchAnalysisById(analysisId);
      if (!a) {
        setLoading(false);
        return;
      }
      setAnalysis(a);
      const sigs = await fetchRiskSignals(analysisId);
      setSignals(sigs);
      if (a.profile_id) {
        const p = await fetchProfileById(a.profile_id);
        setProfile(p as AnalyzedProfile);
      }
      if (a.analysis_type === 'content') {
        const c = await fetchContentAnalysis(analysisId);
        setContentData(c);
      }
      if (a.analysis_type === 'url') {
        const u = await fetchUrlAnalysis(analysisId);
        setUrlData(u);
      }
      if (a.analysis_type === 'media') {
        const m = await fetchMediaAnalysis(analysisId);
        setMediaData(m);
      }
      const revs = await fetchReviewsForAnalysis(analysisId);
      setReviews(revs);
      setLoading(false);
    })();
  }, [analysisId]);

  if (loading) return <LoadingSpinner size={32} />;
  if (!analysis) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50 mb-4">Analysis not found.</p>
        <Link to="/dashboard" className={buttonGhost()}>Back to Dashboard</Link>
      </div>
    );
  }

  // Group signals by category using the same normalization as the risk engine
  const categoryScores = computeCategoryScores(signals).filter((c) => c.signals.length > 0);

  const topSignals = [...signals].sort((a, b) => b.score_contribution - a.score_contribution).slice(0, 8);

  const breakdownData = categoryScores.map((c) => ({
    name: categoryLabels[c.category] || c.category,
    score: c.score,
    fill: c.score >= 61 ? '#f87171' : c.score >= 41 ? '#fbbf24' : c.score >= 21 ? '#38bdf8' : '#34d399',
  }));

  const currentReview = reviews[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-white/50 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Analysis Results</h1>
            <p className="text-xs text-white/40">
              {analysis.analysis_type.toUpperCase()} · {new Date(analysis.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className={buttonGhost('text-sm')}>
            <Printer size={16} /> Generate Report
          </button>
          {role === 'reviewer' || role === 'admin' ? (
            <Link to={`/review/${analysis.id}`} className={buttonPrimary('text-sm')}>
              <ClipboardCheck size={16} /> Review
            </Link>
          ) : null}
        </div>
      </div>

      {/* Demo banner */}
      <div className="flex items-center gap-2 text-xs text-white/40 bg-amber-500/[0.06] rounded-xl p-3 border border-amber-500/15">
        <Zap size={14} className="text-amber-400" />
        AI-Assisted Assessment — Demo heuristic engine. This is a decision-support tool, not a definitive classification.
      </div>

      {/* Top section: Trust Score + Breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Trust Score */}
        <div className="lg:col-span-1">
          <TrustScoreDisplay
            riskScore={analysis.risk_score}
            trustScore={analysis.trust_score}
            riskLevel={analysis.risk_level}
            large
          />
        </div>

        {/* Risk Breakdown chart */}
        <div className={glassCard('p-5 lg:col-span-2')}>
          <h3 className="text-sm font-semibold text-white mb-4">Risk Breakdown by Signal Category</h3>
          {breakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={breakdownData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#ffffff40" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#ffffff60" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{ background: '#0a0e14', border: '1px solid #ffffff20', borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                  {breakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-white/30 text-sm">
              No category breakdown available
            </div>
          )}

          {/* Category mini scores */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
            {categoryScores.map((c) => (
              <div key={c.category} className="text-center">
                <div className="text-lg font-bold tabular-nums" style={{
                  color: c.score >= 61 ? '#f87171' : c.score >= 41 ? '#fbbf24' : c.score >= 21 ? '#38bdf8' : '#34d399'
                }}>
                  {c.score}
                </div>
                <div className="text-[10px] text-white/40 uppercase">{categoryLabels[c.category]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why was this flagged? */}
      <div className={glassCard('p-6')}>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Eye size={18} className="text-cyan-400" /> Why This Was Flagged
        </h3>
        <p className="text-sm text-white/60 mb-5 leading-relaxed">{analysis.summary}</p>

        {topSignals.length > 0 ? (
          <div className="space-y-2">
            {topSignals.map((signal, i) => {
              const colors: Record<string, string> = {
                critical: 'text-red-400',
                high: 'text-orange-400',
                medium: 'text-amber-400',
                low: 'text-sky-400',
              };
              const icons: Record<string, any> = {
                critical: AlertTriangle,
                high: AlertTriangle,
                medium: Info,
                low: CheckCircle2,
              };
              const Icon = icons[signal.severity] || Info;
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <Icon size={16} className={colors[signal.severity]} />
                  <span className="text-sm text-white/80 flex-1">{signal.signal_name}</span>
                  <span className={`text-xs font-bold tabular-nums ${colors[signal.severity]}`}>
                    +{signal.score_contribution}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <CheckCircle2 size={18} className="text-emerald-400" />
            No significant risk indicators detected.
          </div>
        )}
      </div>

      {/* AI Recommendation */}
      <div className={glassCard('p-6')}>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Brain size={18} className="text-cyan-400" /> AI Recommendation
        </h3>
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className={analysis.risk_score >= 60 ? 'text-orange-400 flex-shrink-0' : 'text-emerald-400 flex-shrink-0'} />
          <div>
            <p className="text-sm text-white/70">
              {currentReview?.ai_recommendation || 'No specific recommendation recorded.'}
            </p>
            {analysis.risk_score >= 60 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
                <ShieldAlert size={14} /> Human Review Recommended
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed signals by category */}
      {categoryScores.map((cat) => (
        <div key={cat.category} className={glassCard('p-5')}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white capitalize">
              {categoryLabels[cat.category] || cat.category} Signals
            </h4>
            <span className="text-xs tabular-nums" style={{
              color: cat.score >= 61 ? '#f87171' : cat.score >= 41 ? '#fbbf24' : cat.score >= 21 ? '#38bdf8' : '#34d399'
            }}>
              Score: {cat.score}/100
            </span>
          </div>
          <SignalList signals={cat.signals} />
        </div>
      ))}

      {/* Profile details (if profile analysis) */}
      {profile && (
        <div className={glassCard('p-6')}>
          <h3 className="text-sm font-semibold text-white mb-4">Profile Information</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <DetailItem label="Username" value={`@${profile.username}`} />
            <DetailItem label="Display Name" value={profile.display_name || '—'} />
            <DetailItem label="Followers" value={String(profile.followers)} />
            <DetailItem label="Following" value={String(profile.following)} />
            <DetailItem label="Account Age" value={`${profile.account_age_days} days`} />
            <DetailItem label="Posts" value={String(profile.posts_count)} />
            <DetailItem label="Profile Completion" value={`${profile.profile_completion}%`} />
            <DetailItem label="Verification" value={profile.verification_status} />
            <DetailItem label="External Links" value={profile.external_links || 'None'} />
          </div>
          {profile.bio && (
            <div className="mt-4">
              <div className="text-xs text-white/40 mb-1">Bio</div>
              <p className="text-sm text-white/70 bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">{profile.bio}</p>
            </div>
          )}
        </div>
      )}

      {/* Content details (if content analysis) */}
      {contentData && (
        <div className={glassCard('p-6')}>
          <h3 className="text-sm font-semibold text-white mb-3">Analyzed Content</h3>
          <div className="text-xs text-white/40 mb-2">Classification: {contentData.classification}</div>
          <p className="text-sm text-white/70 bg-white/[0.02] rounded-xl p-4 border border-white/[0.05] font-mono">
            {contentData.content}
          </p>
        </div>
      )}

      {/* URL details */}
      {urlData && (
        <div className={glassCard('p-6')}>
          <h3 className="text-sm font-semibold text-white mb-3">Analyzed URL</h3>
          <div className="text-xs text-white/40 mb-2">Classification: {urlData.classification}</div>
          <p className="text-sm text-cyan-400 bg-white/[0.02] rounded-xl p-4 border border-white/[0.05] font-mono break-all">
            {urlData.url}
          </p>
        </div>
      )}

      {/* Media details */}
      {mediaData && (
        <div className={glassCard('p-6')}>
          <h3 className="text-sm font-semibold text-white mb-3">Analyzed Media</h3>
          <div className="text-xs text-white/40 mb-2">Classification: {mediaData.classification}</div>
          <img src={mediaData.file_url} alt="Analyzed" className="rounded-xl border border-white/10 max-h-64 object-contain bg-black/40" />
        </div>
      )}

      {/* Review status */}
      {currentReview && (
        <div className={glassCard('p-5')}>
          <h3 className="text-sm font-semibold text-white mb-3">Review Status</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <ReviewStatusBadge status={currentReview.status} />
            {currentReview.comments && (
              <p className="text-sm text-white/50 italic">"{currentReview.comments}"</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-white/40 mb-0.5">{label}</div>
      <div className="text-white/80">{value}</div>
    </div>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  const labels: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pending', class: 'bg-white/[0.06] text-white/60 border-white/10' },
    under_review: { label: 'Under Review', class: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
    confirmed_suspicious: { label: 'Confirmed Suspicious', class: 'bg-red-500/10 text-red-400 border-red-500/30' },
    marked_safe: { label: 'Marked Safe', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    needs_more_evidence: { label: 'Needs More Evidence', class: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  };
  const cfg = labels[status] || labels.pending;
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${cfg.class}`}>
      {cfg.label}
    </span>
  );
}
