import { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, AlertCircle, Zap, Info, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/hooks/useRouter';
import { buttonPrimary, analyzerPageClass, analyzerFormCard, analyzerTitleClass, analyzerErrorClass, analyzerInfoBannerClass, analyzerWarningBannerClass, analyzerActionsClass } from '@/lib/ui';
import { LoadingSpinner } from '@/components/ui/StatCard';
import { analyzeMedia } from '@/services/riskEngine';
import { saveMediaAnalysis } from '@/services/analysisService';
import { supabase } from '@/lib/supabase';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageAnalyzerPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('Please upload a PNG, JPG, JPEG, or WEBP image.');
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError('Image must be under 5MB.');
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file || !user) return;

    setLoading(true);

    // Upload to Supabase storage
    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file);

    if (uploadError) {
      setLoading(false);
      setError(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;
    const result = analyzeMedia(fileUrl);

    const { analysis, error: saveError } = await saveMediaAnalysis(user.id, fileUrl, result);
    setLoading(false);

    if (saveError || !analysis) {
      setError(saveError ?? 'Failed to save analysis');
      return;
    }
    navigate(`/analysis/${analysis.id}`);
  };

  return (
    <div className={analyzerPageClass}>
      <div className="min-w-0">
        <h1 className={analyzerTitleClass}>
          <ImageIcon size={24} className="text-cyan-400 flex-shrink-0" /> Image Analyzer
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Upload an image to assess potential manipulation indicators
        </p>
      </div>

      {error && (
        <div className={analyzerErrorClass}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> <span className="break-words">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={analyzerFormCard()}>
        {!previewUrl ? (
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-2xl p-6 sm:p-12 text-center cursor-pointer hover:border-cyan-400/30 hover:bg-white/[0.02] transition-all min-w-0"
          >
            <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4">
              <Upload size={28} />
            </div>
            <p className="text-white/70 font-medium mb-1">Click to upload an image</p>
            <p className="text-xs text-white/40">PNG, JPG, JPEG, WEBP — max 5MB</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-white/10 min-w-0">
            <img src={previewUrl} alt="Preview" className="w-full max-h-60 sm:max-h-80 object-contain bg-black/40" />
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 backdrop-blur text-white/70 hover:text-white hover:bg-black/80 transition-all"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto max-w-[calc(100%-1.5rem)] sm:max-w-[70%] px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur text-xs text-white/70 truncate">
              {file?.name} ({((file?.size ?? 0) / 1024).toFixed(0)} KB)
            </div>
          </div>
        )}

        <div className={analyzerWarningBannerClass}>
          <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="break-words">
            No AI image model configured — results are based on basic heuristic checks only.
            This assessment does not prove image inauthenticity. Results are clearly labeled as "Demo heuristic analysis."
          </span>
        </div>

        <div className={analyzerInfoBannerClass}>
          <Zap size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="break-words">Demo heuristic engine active — checks for stock/default image patterns and metadata availability.</span>
        </div>

        <div className={analyzerActionsClass}>
          <button type="submit" disabled={loading || !file} className={buttonPrimary('disabled:opacity-50 w-full sm:w-auto')}>
            {loading ? 'Analyzing...' : 'Analyze Image'}
          </button>
          {loading && <LoadingSpinner size={20} />}
        </div>
      </form>
    </div>
  );
}
