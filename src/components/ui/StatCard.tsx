import { type ReactNode } from 'react';
import { glassCard } from '@/lib/ui';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: string;
  sublabel?: string;
  className?: string;
}

export function StatCard({ label, value, icon, accent = 'text-cyan-400', sublabel, className = '' }: StatCardProps) {
  return (
    <div className={glassCard(`p-5 relative overflow-hidden group ${className}`)}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-white/[0.05] ${accent}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-sm text-white/50 mt-1">{label}</div>
      {sublabel && <div className="text-xs text-white/30 mt-0.5">{sublabel}</div>}
    </div>
  );
}

interface RiskBadgeProps {
  level: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, size = 'sm' }: RiskBadgeProps) {
  const colors: Record<string, string> = {
    'Trusted': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Low Risk': 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    'Medium Risk': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'High Risk': 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    'Critical': 'bg-red-500/10 text-red-400 border-red-500/30',
  };
  const sizeClass = size === 'lg' ? 'px-4 py-1.5 text-sm' : size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colors[level] ?? colors['Low Risk']} ${sizeClass}`}>
      {level}
    </span>
  );
}

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: size * 2 }}>
      <div
        className="animate-spin rounded-full border-2 border-white/10 border-t-cyan-400"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: string;
}

export function ProgressBar({ value, max = 100, color = 'from-cyan-500 to-blue-500', height = 'h-2' }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={`w-full bg-white/[0.06] rounded-full overflow-hidden ${height}`}>
      <div
        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
