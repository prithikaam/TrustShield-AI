import {
  ShieldCheck, ShieldAlert, Brain, Network, Eye, Link2, Image as ImageIcon,
  FileText, Users, ArrowRight, Activity, ClipboardCheck, Sparkles, CheckCircle2,
} from 'lucide-react';
import { Link } from '@/hooks/useRouter';
import { Logo } from '@/components/ui/Logo';
import { glassCard, buttonPrimary, buttonGhost } from '@/lib/ui';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#06090d] text-white">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/[0.05] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-teal-500/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-12">
        <Logo size="lg" />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/login" className={buttonGhost('text-xs sm:text-sm px-3 sm:px-5')}>Sign In</Link>
          <Link to="/register" className={buttonPrimary('text-xs sm:text-sm px-3 sm:px-5')}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-20 sm:pt-16 lg:pt-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 mb-8">
          <Sparkles size={14} className="text-cyan-400" />
          AI-Powered Digital Trust Intelligence
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-white">TrustShield</span>
          <span className="text-cyan-400"> AI</span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-white/70 font-light max-w-3xl mx-auto mb-4">
          Analyze digital identities, content, URLs, and media to identify suspicious signals —
          with transparent, explainable risk indicators.
        </p>
        <p className="text-base sm:text-lg text-cyan-400/80 font-light italic mb-8 sm:mb-10">
          "Don't just detect risk. Understand why."
        </p>
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <Link to="/register" className={buttonPrimary('text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3')}>
            Analyze Now <ArrowRight size={18} />
          </Link>
          <Link to="/login" className={buttonGhost('text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3')}>
            View Demo
          </Link>
        </div>

        {/* Dashboard preview mockup */}
        <div className="mt-12 sm:mt-16 relative">
          <div className={glassCard('p-6 max-w-4xl mx-auto')}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Analyses', value: '127', color: 'text-cyan-400' },
                { label: 'High Risk', value: '18', color: 'text-orange-400' },
                { label: 'Medium Risk', value: '34', color: 'text-amber-400' },
                { label: 'Avg Trust Score', value: '68', color: 'text-emerald-400' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-white/40 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.05]">
              <div className="text-xs text-white/40 mb-3">Risk Distribution</div>
              <div className="flex items-end gap-2 h-24">
                {[40, 65, 35, 80, 50, 90, 70, 95, 60, 45, 75, 85].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/40 to-blue-500/60"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 lg:right-8 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium">
            Multi-Signal Analysis
          </div>
        </div>
      </section>

      {/* Why Digital Trust Matters */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-4">Why Digital Trust Matters</h2>
        <p className="text-white/50 text-center max-w-2xl mx-auto mb-12">
          Fake identities, impersonation, phishing, scams, and manipulated digital content create real risks
          for individuals and organizations every day.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: 'Fake Identities', desc: 'Fraudulent profiles impersonate real people and brands to deceive victims.' },
            { icon: ShieldAlert, title: 'Phishing & Scams', desc: 'Malicious content and URLs trick users into revealing credentials or sending money.' },
            { icon: Eye, title: 'Manipulated Media', desc: 'Synthetic and manipulated images create false impressions of authenticity.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={glassCard('p-6')}>
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How TrustShield Works */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12">How TrustShield Works</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-2">
          {[
            { label: 'Input', icon: FileText },
            { label: 'Signal Extraction', icon: Activity },
            { label: 'AI Analysis', icon: Brain },
            { label: 'Risk Scoring', icon: ShieldCheck },
            { label: 'Explainability', icon: Eye },
            { label: 'Human Review', icon: ClipboardCheck },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex flex-col items-center gap-2 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-600/10 border border-cyan-400/20 text-cyan-400">
                  <Icon size={20} className="sm:size-[22]" />
                </div>
                <span className="text-[10px] sm:text-xs text-white/60 text-center font-medium leading-tight">{step.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12">Core Capabilities</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Users, title: 'Digital Identity Analysis', desc: 'Analyze profile characteristics, username patterns, and verification signals.' },
            { icon: Activity, title: 'Behavioral Risk Signals', desc: 'Detect unusual account age, follower ratios, and activity patterns.' },
            { icon: FileText, title: 'Content & Scam Detection', desc: 'Identify phishing language, urgency tactics, and financial manipulation.' },
            { icon: Link2, title: 'URL Risk Analysis', desc: 'Evaluate URL structure, shorteners, suspicious keywords, and domain patterns.' },
            { icon: ImageIcon, title: 'Media Analysis', desc: 'Assess uploaded images for potential manipulation indicators.' },
            { icon: Brain, title: 'Explainable AI', desc: 'Every risk score includes a clear explanation of contributing factors.' },
            { icon: ShieldCheck, title: 'Trust Score', desc: 'A 0-100 trust score derived from multi-signal risk assessment.' },
            { icon: ClipboardCheck, title: 'Human Review', desc: 'AI recommends; human reviewers make the final trust and safety decision.' },
          ].map((cap) => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className={glassCard('p-5 hover:border-cyan-400/20 transition-all')}>
                <div className="p-2.5 rounded-lg bg-white/[0.04] text-cyan-400 w-fit mb-3">
                  <Icon size={20} />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{cap.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{cap.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Innovation */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <div className={glassCard('p-6 sm:p-10 lg:p-14')}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-400 mb-6">
            <Sparkles size={14} /> Key Innovation
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Multi-Signal Explainable Digital Trust Scoring</h2>
          <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            TrustShield AI correlates multiple signals — identity, behavior, content, URLs, and media —
            instead of relying on a single indicator. Every score comes with a transparent breakdown of why.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            {[
              'Explainable Trust Score',
              'Multi-Signal Intelligence',
              'Human-in-the-Loop Review',
            ].map((point) => (
              <div key={point} className="flex items-center gap-2 text-sm text-white/70 justify-center">
                <CheckCircle2 size={16} className="text-emerald-400" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to analyze digital trust?</h2>
        <p className="text-white/50 mb-8">Start your first risk analysis in seconds.</p>
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <Link to="/register" className={buttonPrimary('text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3')}>
            Get Started <ArrowRight size={18} />
          </Link>
          <Link to="/login" className={buttonGhost('text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3')}>
            Sign In
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06] py-8 text-center text-sm text-white/30">
        TrustShield AI — Digital Trust & Risk Intelligence Platform · Hackathon Demo
      </footer>
    </div>
  );
}
