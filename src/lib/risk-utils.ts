import type { RiskLevel, Severity, SignalCategory, RiskSignal } from '@/types';

export const RISK_THRESHOLDS = {
  low: 29,
  medium: 59,
} as const;

// Normalization denominators per category — calibrated so typical high-risk
// signal combinations map to 60–100 before weights are applied.
export const CATEGORY_MAX_RAW: Record<SignalCategory, number> = {
  identity: 25,
  behavioral: 50,
  content: 45,
  url: 40,
  media: 80,
};

export const CATEGORY_WEIGHTS: Record<SignalCategory, number> = {
  identity: 0.20,
  behavioral: 0.25,
  content: 0.20,
  url: 0.20,
  media: 0.15,
};

export function scoreToRiskLevel(score: number): RiskLevel {
  const s = clampScore(score);
  if (s <= RISK_THRESHOLDS.low) return 'Low Risk';
  if (s <= RISK_THRESHOLDS.medium) return 'Medium Risk';
  return 'High Risk';
}

export function signalContributionScore(signal: Pick<RiskSignal, 'severity' | 'score_contribution'>): number {
  const severityMultiplier: Record<Severity, number> = {
    low: 0.75,
    medium: 1.5,
    high: 2.25,
    critical: 3,
  };

  return Math.round(signal.score_contribution * severityMultiplier[signal.severity]);
}

export function rawCategoryScore(signals: RiskSignal[]): number {
  return signals.reduce((sum, s) => sum + signalContributionScore(s), 0);
}

export function normalizeCategoryScore(rawScore: number, category: SignalCategory): number {
  const max = CATEGORY_MAX_RAW[category];
  if (max <= 0 || rawScore <= 0) return 0;
  return clampScore((rawScore / max) * 100);
}

export function normalizeRiskScore(rawScore: number, maxRawScore: number): number {
  if (maxRawScore <= 0 || rawScore <= 0) return 0;
  return clampScore((rawScore / maxRawScore) * 100);
}

export function computeCategoryScores(
  signals: RiskSignal[],
): { category: SignalCategory; score: number; signals: RiskSignal[] }[] {
  const categories: SignalCategory[] = ['identity', 'behavioral', 'content', 'url', 'media'];
  return categories.map((category) => {
    const catSignals = signals.filter((s) => s.signal_type === category);
    const raw = rawCategoryScore(catSignals);
    return {
      category,
      score: normalizeCategoryScore(raw, category),
      signals: catSignals,
    };
  });
}

export function calculateWeightedRiskScore(
  categoryScores: { category: SignalCategory; score: number }[],
): number {
  return clampScore(
    categoryScores.reduce((sum, c) => sum + c.score * CATEGORY_WEIGHTS[c.category], 0),
  );
}

export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'Trusted':
      return 'text-emerald-400';
    case 'Low Risk':
      return 'text-sky-400';
    case 'Medium Risk':
      return 'text-amber-400';
    case 'High Risk':
      return 'text-orange-400';
    case 'Critical':
      return 'text-red-400';
  }
}

export function riskLevelBg(level: RiskLevel): string {
  switch (level) {
    case 'Trusted':
      return 'bg-emerald-500/10 border-emerald-500/30';
    case 'Low Risk':
      return 'bg-sky-500/10 border-sky-500/30';
    case 'Medium Risk':
      return 'bg-amber-500/10 border-amber-500/30';
    case 'High Risk':
      return 'bg-orange-500/10 border-orange-500/30';
    case 'Critical':
      return 'bg-red-500/10 border-red-500/30';
  }
}

export function riskLevelHex(level: RiskLevel): string {
  switch (level) {
    case 'Trusted':
      return '#34d399';
    case 'Low Risk':
      return '#38bdf8';
    case 'Medium Risk':
      return '#fbbf24';
    case 'High Risk':
      return '#fb923c';
    case 'Critical':
      return '#f87171';
  }
}

export function severityToScore(sev: Severity): number {
  switch (sev) {
    case 'low':
      return 5;
    case 'medium':
      return 15;
    case 'high':
      return 25;
    case 'critical':
      return 35;
  }
}

export function scoreToSeverity(score: number): Severity {
  if (score >= 25) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function trustFromRisk(risk: number): number {
  return 100 - clampScore(risk);
}

export function getAiRecommendation(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'Trusted':
      return 'No action needed. Profile shows low risk indicators.';
    case 'Low Risk':
      return 'Monitor. Low risk indicators detected — no immediate action required.';
    case 'Medium Risk':
      return 'Monitor closely. Elevated risk indicators warrant periodic review.';
    case 'High Risk':
      return 'Human review recommended. Multiple elevated risk indicators detected.';
    case 'Critical':
      return 'Human review strongly recommended. Multiple critical risk indicators detected across signals.';
  }
}
