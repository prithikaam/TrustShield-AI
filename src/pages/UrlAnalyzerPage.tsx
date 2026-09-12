import { useState } from 'react';
import { Link2, Sparkles, AlertCircle, Zap, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import { inputClass, buttonPrimary, buttonGhost, analyzerPageClass, analyzerFormCard, analyzerHeaderClass, analyzerTitleClass, analyzerErrorClass, analyzerInfoBannerClass, analyzerWarningBannerClass, analyzerActionsClass } from '@/lib/ui';
import { LoadingSpinner } from '@/components/ui/StatCard';
import { analyzeUrl, DEMO_URL } from '@/services/riskEngine';
import { saveUrlAnalysis } from '@/services/analysisService';

export function UrlAnalyzerPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError('Please enter a URL to analyze.');
      return;
    }
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      setError('Please enter a valid URL.');
      return;
    }
    if (!user) return;

    setLoading(true);
    const result = analyzeUrl(url);
    const { analysis, error: saveError } = await saveUrlAnalysis(user.id, url, result);
    setLoading(false);

    if (saveError || !analysis) {
      setError(saveError ?? 'Failed to save analysis');
      return;
    }
    navigate(`/analysis/${analysis.id}`);
  };

  return (
    <div className={analyzerPageClass}>
      <div className={analyzerHeaderClass}>
        <div className="min-w-0">
          <h1 className={analyzerTitleClass}>
            <Link2 size={24} className="text-cyan-400 flex-shrink-0" /> URL Risk Analyzer
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Evaluate URL structure, shorteners, suspicious keywords, and domain patterns
          </p>
        </div>
        <button onClick={() => setUrl(DEMO_URL)} className={buttonGhost('text-sm w-full sm:w-auto flex-shrink-0')}>
          <Sparkles size={16} className="text-amber-400" /> Load Demo URL
        </button>
      </div>

      {error && (
        <div className={analyzerErrorClass}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> <span className="break-words">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={analyzerFormCard()}>
        <div className="min-w-0">
          <label className="block text-xs text-white/50 mb-1.5">URL to Analyze</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/claim-reward"
            className={inputClass('font-mono text-sm min-w-0')}
          />
        </div>

        <div className={analyzerWarningBannerClass}>
          <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="break-words">
            External reputation intelligence unavailable — heuristic analysis only.
            This tool does not query a real threat-intelligence database. It evaluates URL structure and patterns.
          </span>
        </div>

        <div className={analyzerInfoBannerClass}>
          <Zap size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="break-words">Demo heuristic engine active — evaluates HTTPS, domain structure, shorteners, suspicious keywords, and TLD patterns.</span>
        </div>

        <div className={analyzerActionsClass}>
          <button type="submit" disabled={loading} className={buttonPrimary('disabled:opacity-50 w-full sm:w-auto')}>
            {loading ? 'Analyzing...' : 'Analyze URL'}
          </button>
          {loading && <LoadingSpinner size={20} />}
        </div>
      </form>
    </div>
  );
}
