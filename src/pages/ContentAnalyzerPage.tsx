import { useState } from 'react';
import { FileText, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import { inputClass, buttonPrimary, buttonGhost, analyzerPageClass, analyzerFormCard, analyzerHeaderClass, analyzerTitleClass, analyzerErrorClass, analyzerInfoBannerClass, analyzerActionsClass } from '@/lib/ui';
import { LoadingSpinner } from '@/components/ui/StatCard';
import { analyzeContent, DEMO_CONTENT } from '@/services/riskEngine';
import { saveContentAnalysis } from '@/services/analysisService';

export function ContentAnalyzerPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!content.trim()) {
      setError('Please enter some content to analyze.');
      return;
    }
    if (!user) return;

    setLoading(true);
    const result = analyzeContent(content);
    const { analysis, error: saveError } = await saveContentAnalysis(user.id, content, result);
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
            <FileText size={24} className="text-cyan-400 flex-shrink-0" /> Content Risk Analyzer
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Analyze messages, emails, posts, and chat content for phishing and scam indicators
          </p>
        </div>
        <button
          onClick={() => setContent(DEMO_CONTENT)}
          className={buttonGhost('text-sm w-full sm:w-auto flex-shrink-0')}
        >
          <Sparkles size={16} className="text-amber-400" /> Load Demo Content
        </button>
      </div>

      {error && (
        <div className={analyzerErrorClass}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> <span className="break-words">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={analyzerFormCard()}>
        <div className="min-w-0">
          <label className="block text-xs text-white/50 mb-1.5">
            Content to Analyze
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste a message, email, social media post, or chat message here..."
            rows={8}
            className={inputClass('resize-none font-mono text-sm min-w-0')}
          />
          <div className="text-xs text-white/30 mt-1">
            {content.length} characters
          </div>
        </div>

        <div className={analyzerInfoBannerClass}>
          <Zap size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="break-words">Demo heuristic engine active — detects phishing patterns, urgency language, financial requests, and social engineering indicators.</span>
        </div>

        <div className={analyzerActionsClass}>
          <button type="submit" disabled={loading} className={buttonPrimary('disabled:opacity-50 w-full sm:w-auto')}>
            {loading ? 'Analyzing...' : 'Analyze Content'}
          </button>
          {loading && <LoadingSpinner size={20} />}
        </div>
      </form>
    </div>
  );
}
