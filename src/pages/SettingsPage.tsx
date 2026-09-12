import { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Mail, Save, CheckCircle2, AlertCircle, Zap, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { inputClass, buttonPrimary, glassCard } from '@/lib/ui';
import { supabase } from '@/lib/supabase';

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from('user_profiles').update({ full_name: fullName }).eq('user_id', user.id);
    setSaving(false);
    if (error) { setMessage({ type: 'error', text: error.message }); }
    else { setMessage({ type: 'success', text: 'Settings saved successfully.' }); await refreshProfile(); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><SettingsIcon size={24} className="text-cyan-400" /> Settings</h1>
        <p className="text-sm text-white/40 mt-1">Manage your account and platform configuration</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className={glassCard('p-6 space-y-4')}>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><User size={16} className="text-cyan-400" /> Profile</h3>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className={inputClass()} />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="email" value={user?.email || ''} disabled className={inputClass('pl-10 opacity-60')} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Role</label>
          <div className="flex items-center gap-2"><Shield size={16} className="text-cyan-400" /><span className="text-sm text-white/70 capitalize">{profile?.role || 'user'}</span></div>
        </div>
        <button onClick={handleSave} disabled={saving} className={buttonPrimary('disabled:opacity-50')}><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      <div className={glassCard('p-6 space-y-3')}>
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Brain size={16} className="text-cyan-400" /> AI Engine</h3>
        <div className="flex items-start gap-3 bg-amber-500/[0.06] rounded-xl p-4 border border-amber-500/15">
          <Zap size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/60">
            <p className="font-medium text-amber-400 mb-1">Demo Heuristic Engine (Active)</p>
            <p className="text-xs leading-relaxed">The application is using a deterministic rule-based risk engine. No external AI API is configured. The engine analyzes profile, content, URL, and media signals using transparent heuristics. Results are clearly labeled as "AI-Assisted Assessment" and do not represent a trained ML model.</p>
          </div>
        </div>
        <div className="text-xs text-white/30 space-y-1">
          <div className="flex items-center justify-between py-1"><span>External AI API</span><span className="text-white/40">Not configured</span></div>
          <div className="flex items-center justify-between py-1"><span>Image Analysis Model</span><span className="text-white/40">Not configured</span></div>
          <div className="flex items-center justify-between py-1"><span>URL Threat Intelligence</span><span className="text-white/40">Not configured</span></div>
        </div>
      </div>

      <div className={glassCard('p-6')}>
        <h3 className="text-sm font-semibold text-white mb-2">About TrustShield AI</h3>
        <p className="text-sm text-white/50 leading-relaxed">TrustShield AI is a Digital Trust & Risk Analysis Platform that analyzes multiple signals — identity, behavioral, content, URL, and media — to produce explainable risk scores. AI recommends; human reviewers make the final decision.</p>
        <p className="text-xs text-white/30 mt-3">Hackathon Demo · Multi-Signal Explainable Digital Trust</p>
      </div>
    </div>
  );
}
