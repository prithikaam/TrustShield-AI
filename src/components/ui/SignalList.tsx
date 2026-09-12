import type { RiskSignal } from '@/types';
import { AlertTriangle, AlertCircle, Info, ShieldCheck, CircleAlert } from 'lucide-react';

const severityConfig = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: CircleAlert, label: 'Critical' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: AlertTriangle, label: 'High Risk' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertCircle, label: 'Medium Risk' },
  low: { color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', icon: Info, label: 'Low Risk' },
};

interface SignalListProps {
  signals: RiskSignal[];
  showContribution?: boolean;
}

export function SignalList({ signals, showContribution = true }: SignalListProps) {
  if (signals.length === 0) {
    return (
      <div className="flex items-center gap-2 text-white/40 text-sm py-4">
        <ShieldCheck size={18} className="text-emerald-400" />
        No risk indicators detected in this category.
      </div>
    );
  }

  const sorted = [...signals].sort((a, b) => b.score_contribution - a.score_contribution);

  return (
    <div className="space-y-2">
      {sorted.map((signal, i) => {
        const cfg = severityConfig[signal.severity];
        const Icon = cfg.icon;
        return (
          <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${cfg.bg}`}>
            <Icon size={18} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-white">{signal.signal_name}</span>
                {showContribution && signal.score_contribution > 0 && (
                  <span className={`text-xs font-bold tabular-nums ${cfg.color} flex-shrink-0`}>+{signal.score_contribution}</span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5">{signal.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-white/30">·</span>
                <span className="text-[10px] text-white/30">Confidence: {Math.round(signal.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
