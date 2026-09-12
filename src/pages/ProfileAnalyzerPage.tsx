import { useState } from 'react';
import { UserSearch, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import { inputClass, buttonPrimary, buttonGhost, analyzerPageClass, analyzerFormCard, analyzerHeaderClass, analyzerTitleClass, analyzerErrorClass, analyzerInfoBannerClass, analyzerActionsClass } from '@/lib/ui';
import { LoadingSpinner } from '@/components/ui/StatCard';
import { analyzeProfile, DEMO_PROFILE } from '@/services/riskEngine';
import { saveProfileAnalysis } from '@/services/analysisService';
import type { ProfileInput } from '@/types';

export function ProfileAnalyzerPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [form, setForm] = useState<ProfileInput>({
    username: '',
    display_name: '',
    bio: '',
    followers: 0,
    following: 0,
    account_age_days: 0,
    posts_count: 0,
    profile_completion: 50,
    verification_status: 'unverified',
    external_links: '',
    profile_image_url: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof ProfileInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const loadDemo = () => {
    setForm({ ...DEMO_PROFILE });
  };

  const validate = (): string | null => {
    if (!form.username.trim()) return 'Username is required';
    if (form.followers < 0) return 'Followers cannot be negative';
    if (form.following < 0) return 'Following cannot be negative';
    if (form.account_age_days < 0) return 'Account age cannot be negative';
    if (form.posts_count < 0) return 'Posts count cannot be negative';
    if (form.profile_completion < 0 || form.profile_completion > 100)
      return 'Profile completion must be 0-100';
    if (form.external_links) {
      const urls = form.external_links.split(/[,\s]+/).filter(Boolean);
      for (const u of urls) {
        try {
          new URL(u.startsWith('http') ? u : `https://${u}`);
        } catch {
          return `Invalid URL: ${u}`;
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!user) return;

    setLoading(true);
    const result = analyzeProfile(form);
    const { analysis, error: saveError } = await saveProfileAnalysis(user.id, form, result);
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
            <UserSearch size={24} className="text-cyan-400 flex-shrink-0" /> Profile Risk Analyzer
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Analyze a digital profile across identity, behavioral, content, URL, and media signals
          </p>
        </div>
        <button onClick={loadDemo} className={buttonGhost('text-sm w-full sm:w-auto flex-shrink-0')}>
          <Sparkles size={16} className="text-amber-400" /> Load Demo Data
        </button>
      </div>

      {error && (
        <div className={analyzerErrorClass}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> <span className="break-words">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={analyzerFormCard()}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Username *</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              placeholder="@fake_shop_9281"
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Display Name</label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => update('display_name', e.target.value)}
              placeholder="Official Store"
              className={inputClass()}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            placeholder="Best offers. Contact us."
            rows={3}
            className={inputClass('resize-none')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Followers</label>
            <input
              type="number"
              min="0"
              value={form.followers}
              onChange={(e) => update('followers', parseInt(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Following</label>
            <input
              type="number"
              min="0"
              value={form.following}
              onChange={(e) => update('following', parseInt(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Account Age (days)</label>
            <input
              type="number"
              min="0"
              value={form.account_age_days}
              onChange={(e) => update('account_age_days', parseInt(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Posts</label>
            <input
              type="number"
              min="0"
              value={form.posts_count}
              onChange={(e) => update('posts_count', parseInt(e.target.value) || 0)}
              className={inputClass()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Profile Completion: {form.profile_completion}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.profile_completion}
              onChange={(e) => update('profile_completion', parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Verification Status</label>
            <select
              value={form.verification_status}
              onChange={(e) => update('verification_status', e.target.value)}
              className={inputClass()}
            >
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">External Links</label>
            <input
              type="text"
              value={form.external_links}
              onChange={(e) => update('external_links', e.target.value)}
              placeholder="https://example.com"
              className={inputClass()}
            />
          </div>
        </div>

        <div className={analyzerInfoBannerClass}>
          <Zap size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="break-words">Demo heuristic engine active — analysis uses deterministic rule-based scoring, not a trained ML model.</span>
        </div>

        <div className={analyzerActionsClass}>
          <button type="submit" disabled={loading} className={buttonPrimary('disabled:opacity-50 w-full sm:w-auto')}>
            {loading ? 'Analyzing...' : 'Analyze Profile'}
          </button>
          {loading && <LoadingSpinner size={20} />}
        </div>
      </form>
    </div>
  );
}
