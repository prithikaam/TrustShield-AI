import { RiskBadge } from '@/components/ui/StatCard';
import { riskLevelBg } from '@/lib/risk-utils';
import type { RiskLevel } from '@/types';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface TrustScoreDisplayProps {
  riskScore: number;
  trustScore: number;
  riskLevel: RiskLevel;
  large?: boolean;
}

export function TrustScoreDisplay({ riskScore, trustScore, riskLevel, large = false }: TrustScoreDisplayProps) {
  const icon = riskLevel === 'Trusted' ? <ShieldCheck /> : riskLevel === 'Critical' || riskLevel === 'High Risk' ? <ShieldX /> : <ShieldAlert />;
  const iconColor = riskLevel === 'Trusted' ? 'text-emerald-400' : riskLevel === 'Low Risk' ? 'text-sky-400' : riskLevel === 'Medium Risk' ? 'text-amber-400' : riskLevel === 'High Risk' ? 'text-orange-400' : 'text-red-400';

  const sizeClass = large ? 'p-8' : 'p-5';

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${riskLevelBg(riskLevel)} ${sizeClass}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <div className="relative flex flex-col items-center text-center">
        <div className={`${iconColor} mb-3`} style={{ width: large ? 40 : 28, height: large ? 40 : 28 }}>
          {icon}
        </div>
        <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Digital Trust Assessment</div>
        <div className="flex items-baseline gap-1">
          <span className={`font-bold tabular-nums ${iconColor} ${large ? 'text-6xl' : 'text-3xl'}`}>{trustScore}</span>
          <span className="text-white/30 text-lg">/100</span>
        </div>
        <div className="mt-3">
          <RiskBadge level={riskLevel} size="lg" />
        </div>
        {riskScore >= 60 && (
          <div className="mt-3 text-xs text-white/50 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-orange-400" />
            Human Review Recommended
          </div>
        )}
        <div className="mt-2 text-xs text-white/30">
          Risk Score: {riskScore}/100 · AI-Assisted Assessment
        </div>
      </div>
    </div>
  );
}
