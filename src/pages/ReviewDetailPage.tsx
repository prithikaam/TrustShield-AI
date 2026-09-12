import { useEffect, useState } from 'react';
import {
  ArrowLeft, ClipboardCheck, ShieldCheck, ShieldAlert, AlertCircle,
  MessageSquare, Save,
} from 'lucide-react';
import { useRouter, Link } from '@/hooks/useRouter';
import { useAuth } from '@/hooks/useAuth';
import { TrustScoreDisplay } from '@/components/ui/TrustScoreDisplay';
import { SignalList } from '@/components/ui/SignalList';
import { LoadingSpinner } from '@/components/ui/StatCard';
import { glassCard, buttonGhost, buttonDanger, buttonSuccess, inputClass } from '@/lib/ui';
import { fetchAnalysisById, fetchRiskSignals, fetchReviewsForAnalysis } from '@/services/analysisService';
import { supabase } from '@/lib/supabase';
import type { Analysis, RiskSignal } from '@/types';

export function ReviewDetailPage({ analysisId }: { analysisId: string }) {
  const { role, user } = useAuth();
  const { navigate } = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [signals, setSignals] = useState<RiskSignal[]>([]);
  const [review, setReview] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const a = await fetchAnalysisById(analysisId);
      if (!a) { setLoading(false); return; }
      setAnalysis(a);
      const sigs = await fetchRiskSignals(analysisId);
      setSignals(sigs);
      const revs = await fetchReviewsForAnalysis(analysisId);
      if (revs.length > 0) { setReview(revs[0]); setComments(revs[0].comments || ''); }
      setLoading(false);
    })();
  }, [analysisId]);

  const updateReview = async (status: string) => {
    if (!analysis || !user) return;
    setSaving(true);
    setMessage(null);

    if (review) {
      const { error } = await supabase
        .from('reviews')
        .update({ status, comments, reviewer_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', review.id);
      if (error) { setMessage(`Error: ${error.message}`); }
      else { setMessage('Review updated successfully.'); setReview({ ...review, status, comments }); }
    } else {
      const { data, error } = await supabase
        .from('reviews')
        .insert({ analysis_id: analysisId, reviewer_id: user.id, status, comments, ai_recommendation: analysis.summary })
        .select().maybeSingle();
      if (error) { setMessage(`Error: ${error.message}`); }
      else { setMessage('Review created successfully.'); setReview(data); }
    }

    await supabase.from('analyses').update({ status: 'reviewed' }).eq('id', analysisId);
    setSaving(false);
  };

  if (loading) return <LoadingSpinner size={32} />;

  if (role !== 'reviewer' && role !== 'admin') {
    return (
      <div className={glassCard('p-12 text-center')}>
        <p className="text-white/50 mb-4">Access restricted to reviewers and admins.</p>
        <Link to="/dashboard" className={buttonGhost()}>Back to Dashboard</Link>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <p className="text-white/50 mb-4">Analysis not found.</p>
        <Link to="/review" className={buttonGhost()}>Back to Review Queue</Link>
      </div>
    );
  }

  const topSignals = [...signals].sort((a, b) => b.score_contribution - a.score_contribution).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link to="/review" className="text-white/50 hover:text-white"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardCheck size={20} className="text-cyan-400" /> Review Detail</h1>
            <p className="text-xs text-white/40">{analysis.identifier}</p>
          </div>
        </div>
        <Link to={`/analysis/${analysis.id}`} className={buttonGhost('text-sm')}>View Full Analysis</Link>
      </div>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${message.startsWith('Error') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          {message.startsWith('Error') ? <AlertCircle size={16} /> : <ShieldCheck size={16} />}
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <TrustScoreDisplay riskScore={analysis.risk_score} trustScore={analysis.trust_score} riskLevel={analysis.risk_level} large />
        <div className={glassCard('p-5 lg:col-span-2 space-y-4')}>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2"><ShieldAlert size={16} className="text-cyan-400" /> AI Recommendation</h3>
            <p className="text-sm text-white/60">{review?.ai_recommendation || analysis.summary}</p>
          </div>
          <div>
            <h4 className="text-xs text-white/40 uppercase tracking-wide mb-2">Top Risk Factors</h4>
            <SignalList signals={topSignals} />
          </div>
        </div>
      </div>

      <div className={glassCard('p-6 space-y-4')}>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><MessageSquare size={16} className="text-cyan-400" /> Reviewer Decision</h3>
        {review && (
          <div className="flex items-center gap-2 text-sm"><span className="text-white/40">Current status:</span><span className="capitalize text-white/70">{review.status.replace(/_/g, ' ')}</span></div>
        )}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Reviewer Comments</label>
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Add your review notes here..." rows={4} className={inputClass('resize-none')} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => updateReview('confirmed_suspicious')} disabled={saving} className={buttonDanger('disabled:opacity-50')}><ShieldAlert size={16} /> Confirm Suspicious</button>
          <button onClick={() => updateReview('marked_safe')} disabled={saving} className={buttonSuccess('disabled:opacity-50')}><ShieldCheck size={16} /> Mark Safe</button>
          <button onClick={() => updateReview('needs_more_evidence')} disabled={saving} className={buttonGhost('disabled:opacity-50')}><AlertCircle size={16} /> Needs More Evidence</button>
          <button onClick={() => updateReview('under_review')} disabled={saving} className={buttonGhost('disabled:opacity-50')}><Save size={16} /> Save as Under Review</button>
          {saving && <LoadingSpinner size={20} />}
        </div>
        <p className="text-xs text-white/30">AI recommends — the human reviewer makes the final decision. This is a decision-support system.</p>
      </div>
    </div>
  );
}
