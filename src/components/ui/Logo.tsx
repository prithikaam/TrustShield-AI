import { ShieldCheck } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'lg' ? 28 : size === 'sm' ? 18 : 22;
  const textSize = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-lg" />
        <div className="relative p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30">
          <ShieldCheck size={iconSize} className="text-cyan-400" />
        </div>
      </div>
      <div className="leading-none">
        <span className={`font-bold text-white tracking-tight ${textSize}`}>TrustShield</span>
        <span className={`font-light text-cyan-400 tracking-tight ${textSize}`}> AI</span>
      </div>
    </div>
  );
}
