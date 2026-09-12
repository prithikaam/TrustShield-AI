// Shared UI class helpers for the dark cybersecurity theme

export function glassCard(extra: string = ''): string {
  return `bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl ${extra}`;
}

export function glassCardHover(extra: string = ''): string {
  return `bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.05] ${extra}`;
}

export function inputClass(extra: string = ''): string {
  return `w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all ${extra}`;
}

export function buttonPrimary(extra: string = ''): string {
  return `inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20 ${extra}`;
}

export function buttonGhost(extra: string = ''): string {
  return `inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-white/80 hover:text-white font-medium px-5 py-2.5 rounded-xl transition-all duration-300 ${extra}`;
}

export function buttonDanger(extra: string = ''): string {
  return `inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium px-5 py-2.5 rounded-xl transition-all duration-300 ${extra}`;
}

export function buttonSuccess(extra: string = ''): string {
  return `inline-flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium px-5 py-2.5 rounded-xl transition-all duration-300 ${extra}`;
}

// Shared responsive layout for analyzer pages
export const analyzerPageClass =
  'space-y-4 sm:space-y-6 w-full max-w-5xl xl:max-w-6xl mx-auto min-w-0';

export function analyzerFormCard(extra: string = ''): string {
  return glassCard(`p-4 sm:p-6 space-y-4 sm:space-y-5 w-full min-w-0 ${extra}`);
}

export const analyzerHeaderClass =
  'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4';

export const analyzerTitleClass =
  'text-xl sm:text-2xl font-bold text-white flex items-center gap-2 flex-wrap';

export const analyzerErrorClass =
  'flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm min-w-0';

export const analyzerInfoBannerClass =
  'flex items-start gap-2 text-xs text-white/30 bg-white/[0.02] rounded-xl p-3 border border-white/[0.05] min-w-0';

export const analyzerWarningBannerClass =
  'flex items-start gap-2 text-xs text-white/40 bg-amber-500/[0.06] rounded-xl p-3 border border-amber-500/15 min-w-0';

export const analyzerActionsClass = 'flex flex-wrap items-center gap-3';
