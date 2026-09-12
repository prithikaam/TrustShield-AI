import { supabase } from '@/lib/supabase';
import type {
  Analysis, ProfileInput, RiskResult, RiskSignal,
  ContentRiskResult, UrlRiskResult, MediaRiskResult,
} from '@/types';

export async function saveProfileAnalysis(
  userId: string,
  input: ProfileInput,
  result: RiskResult,
): Promise<{ analysis: Analysis | null; error: string | null }> {
  // 1. Save the analyzed profile
  const { data: profile, error: profileError } = await supabase
    .from('analyzed_profiles')
    .insert({
      user_id: userId,
      username: input.username,
      display_name: input.display_name,
      bio: input.bio,
      followers: input.followers,
      following: input.following,
      account_age_days: input.account_age_days,
      posts_count: input.posts_count,
      profile_completion: input.profile_completion,
      verification_status: input.verification_status,
      external_links: input.external_links,
      profile_image_url: input.profile_image_url ?? null,
    })
    .select()
    .maybeSingle();

  if (profileError || !profile) {
    return { analysis: null, error: profileError?.message ?? 'Failed to save profile' };
  }

  // 2. Save the analysis
  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .insert({
      user_id: userId,
      profile_id: profile.id,
      analysis_type: 'profile',
      identifier: `@${input.username}`,
      risk_score: result.risk_score,
      trust_score: result.trust_score,
      risk_level: result.risk_level,
      summary: result.summary,
      status: 'completed',
    })
    .select()
    .maybeSingle();

  if (analysisError || !analysis) {
    return { analysis: null, error: analysisError?.message ?? 'Failed to save analysis' };
  }

  // 3. Save risk signals
  if (result.signals.length > 0) {
    const signalRows = result.signals.map((s) => ({
      analysis_id: analysis.id,
      signal_type: s.signal_type,
      signal_name: s.signal_name,
      description: s.description,
      severity: s.severity,
      score_contribution: s.score_contribution,
      confidence: s.confidence,
    }));
    await supabase.from('risk_signals').insert(signalRows);
  }

  // 4. Save trust history entry
  await supabase.from('trust_history').insert({
    user_id: userId,
    profile_id: profile.id,
    trust_score: result.trust_score,
    risk_score: result.risk_score,
    reason: `Initial analysis: ${result.risk_level}`,
  });

  // 5. Create review record if high risk
  if (result.risk_score >= 60) {
    await supabase.from('reviews').insert({
      analysis_id: analysis.id,
      status: 'pending',
      ai_recommendation: result.ai_recommendation,
    });
  }

  return { analysis: analysis as Analysis, error: null };
}

export async function saveContentAnalysis(
  userId: string,
  content: string,
  result: ContentRiskResult,
): Promise<{ analysis: Analysis | null; error: string | null }> {
  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .insert({
      user_id: userId,
      analysis_type: 'content',
      identifier: content.slice(0, 80),
      risk_score: result.risk_score,
      trust_score: result.trust_score,
      risk_level: result.risk_level,
      summary: result.explanation,
      status: 'completed',
    })
    .select()
    .maybeSingle();

  if (analysisError || !analysis) {
    return { analysis: null, error: analysisError?.message ?? 'Failed to save analysis' };
  }

  await supabase.from('content_analyses').insert({
    user_id: userId,
    content,
    classification: result.classification,
    risk_score: result.risk_score,
    explanation: result.explanation,
    analysis_id: analysis.id,
  });

  if (result.signals.length > 0) {
    await supabase.from('risk_signals').insert(
      result.signals.map((s) => ({
        analysis_id: analysis.id,
        signal_type: s.signal_type,
        signal_name: s.signal_name,
        description: s.description,
        severity: s.severity,
        score_contribution: s.score_contribution,
        confidence: s.confidence,
      })),
    );
  }

  if (result.risk_score >= 60) {
    await supabase.from('reviews').insert({
      analysis_id: analysis.id,
      status: 'pending',
      ai_recommendation: result.ai_recommendation,
    });
  }

  return { analysis: analysis as Analysis, error: null };
}

export async function saveUrlAnalysis(
  userId: string,
  url: string,
  result: UrlRiskResult,
): Promise<{ analysis: Analysis | null; error: string | null }> {
  const { data: analysis, error } = await supabase
    .from('analyses')
    .insert({
      user_id: userId,
      analysis_type: 'url',
      identifier: url,
      risk_score: result.risk_score,
      trust_score: result.trust_score,
      risk_level: result.risk_level,
      summary: result.explanation,
      status: 'completed',
    })
    .select()
    .maybeSingle();

  if (error || !analysis) {
    return { analysis: null, error: error?.message ?? 'Failed to save analysis' };
  }

  await supabase.from('url_analyses').insert({
    user_id: userId,
    url,
    risk_score: result.risk_score,
    classification: result.classification,
    explanation: result.explanation,
    analysis_id: analysis.id,
  });

  if (result.signals.length > 0) {
    await supabase.from('risk_signals').insert(
      result.signals.map((s) => ({
        analysis_id: analysis.id,
        signal_type: s.signal_type,
        signal_name: s.signal_name,
        description: s.description,
        severity: s.severity,
        score_contribution: s.score_contribution,
        confidence: s.confidence,
      })),
    );
  }

  if (result.risk_score >= 60) {
    await supabase.from('reviews').insert({
      analysis_id: analysis.id,
      status: 'pending',
      ai_recommendation: result.ai_recommendation,
    });
  }

  return { analysis: analysis as Analysis, error: null };
}

export async function saveMediaAnalysis(
  userId: string,
  fileUrl: string,
  result: MediaRiskResult,
): Promise<{ analysis: Analysis | null; error: string | null }> {
  const { data: analysis, error } = await supabase
    .from('analyses')
    .insert({
      user_id: userId,
      analysis_type: 'media',
      identifier: fileUrl.slice(0, 80),
      risk_score: result.risk_score,
      trust_score: result.trust_score,
      risk_level: result.risk_level,
      summary: result.explanation,
      status: 'completed',
    })
    .select()
    .maybeSingle();

  if (error || !analysis) {
    return { analysis: null, error: error?.message ?? 'Failed to save analysis' };
  }

  await supabase.from('media_analyses').insert({
    user_id: userId,
    file_url: fileUrl,
    risk_score: result.risk_score,
    classification: result.classification,
    explanation: result.explanation,
    analysis_id: analysis.id,
  });

  if (result.signals.length > 0) {
    await supabase.from('risk_signals').insert(
      result.signals.map((s) => ({
        analysis_id: analysis.id,
        signal_type: s.signal_type,
        signal_name: s.signal_name,
        description: s.description,
        severity: s.severity,
        score_contribution: s.score_contribution,
        confidence: s.confidence,
      })),
    );
  }

  if (result.risk_score >= 60) {
    await supabase.from('reviews').insert({
      analysis_id: analysis.id,
      status: 'pending',
      ai_recommendation: result.ai_recommendation,
    });
  }

  return { analysis: analysis as Analysis, error: null };
}

export async function fetchUserAnalyses(userId: string, limit: number = 100): Promise<Analysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Analysis[];
}

export async function fetchAnalysisById(id: string): Promise<Analysis | null> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Analysis;
}

export async function fetchRiskSignals(analysisId: string): Promise<RiskSignal[]> {
  const { data, error } = await supabase
    .from('risk_signals')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('score_contribution', { ascending: false });

  if (error || !data) return [];
  return data as RiskSignal[];
}

export async function fetchAllAnalysesForReview(limit: number = 100): Promise<Analysis[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Analysis[];
}

export async function fetchReviewsForAnalysis(analysisId: string) {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function fetchTrustHistory(profileId: string) {
  const { data } = await supabase
    .from('trust_history')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function fetchProfileById(id: string) {
  const { data } = await supabase
    .from('analyzed_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data;
}

export async function fetchContentAnalysis(analysisId: string) {
  const { data } = await supabase
    .from('content_analyses')
    .select('*')
    .eq('analysis_id', analysisId)
    .maybeSingle();
  return data;
}

export async function fetchUrlAnalysis(analysisId: string) {
  const { data } = await supabase
    .from('url_analyses')
    .select('*')
    .eq('analysis_id', analysisId)
    .maybeSingle();
  return data;
}

export async function fetchMediaAnalysis(analysisId: string) {
  const { data } = await supabase
    .from('media_analyses')
    .select('*')
    .eq('analysis_id', analysisId)
    .maybeSingle();
  return data;
}
