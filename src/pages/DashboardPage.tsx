import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, ShieldAlert, ShieldCheck, Activity, TrendingUp,
  Plus, Eye, ArrowRight, FileText, Link2, Image as ImageIcon, UserSearch,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, Link } from '@/hooks/useRouter';
import { StatCard, RiskBadge, LoadingSpinner } from '@/components/ui/StatCard';
import { glassCard, buttonPrimary } from '@/lib/ui';
import { fetchUserAnalyses } from '@/services/analysisService';
import { riskLevelHex } from '@/lib/risk-utils';
import type { Analysis } from '@/types';

export function DashboardPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchUserAnalyses(user.id).then((data) => {
      setAnalyses(data);
      setLoading(false);
    });
  }, [user]);

  const stats = useMemo(() => {
    const total = analyses.length;
    const high = analyses.filter((a) => a.risk_score >= 61).length;
    const medium = analyses.filter((a) => a.risk_score >= 41 && a.risk_score <= 60).length;
    const low = analyses.filter((a) => a.risk_score <= 40).length;
    const avgTrust = total > 0 ? Math.round(analyses.reduce((s, a) => s + a.trust_score, 0) / total) : 0;
    return { total, high, medium, low, avgTrust };
  }, [analyses]);

  const trendData = useMemo(() => {
    const recent = [...analyses].reverse().slice(-12);
    return recent.map((a, i) => ({
      name: `#${i + 1}`,
      trust: a.trust_score,
      risk: a.risk_score,
    }));
  }, [analyses]);

  const distributionData = useMemo(() => {
    const levels = ['Trusted', 'Low Risk', 'Medium Risk', 'High Risk', 'Critical'];
    return levels.map((level) => ({
      name: level,
      value: analyses.filter((a) => a.risk_level === level).length,
    })).filter((d) => d.value > 0);
  }, [analyses]);

  const typeData = useMemo(() => {
    const types = ['profile', 'content', 'url', 'media'];
    return types.map((type) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      count: analyses.filter((a) => a.analysis_type === type).length,
    }));
  }, [analyses]);

  if (loading) {
    return <LoadingSpinner size={32} />;
  }

  const isEmpty = analyses.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Digital trust intelligence overview</p>
        </div>
        <Link to="/analyzer/profile" className={buttonPrimary()}>
          <Plus size={18} /> Analyze New Identity
        </Link>
      </div>

      {isEmpty ? (
        <div className={glassCard('p-12 text-center')}>
          <div className="inline-flex p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No analyses yet</h2>
          <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">
            Start by analyzing a digital profile, piece of content, URL, or image.
            Every analysis produces an explainable risk score.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/analyzer/profile" className={buttonPrimary()}><UserSearch size={16} /> Profile</Link>
            <Link to="/analyzer/content" className={buttonPrimary()}><FileText size={16} /> Content</Link>
            <Link to="/analyzer/url" className={buttonPrimary()}><Link2 size={16} /> URL</Link>
            <Link to="/analyzer/image" className={buttonPrimary()}><ImageIcon size={16} /> Image</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard label="Total Analyses" value={stats.total} icon={<BarChart3 size={20} />} />
            <StatCard label="High Risk" value={stats.high} icon={<ShieldAlert size={20} />} accent="text-orange-400" />
            <StatCard label="Medium Risk" value={stats.medium} icon={<Activity size={20} />} accent="text-amber-400" />
            <StatCard label="Low Risk" value={stats.low} icon={<ShieldCheck size={20} />} accent="text-emerald-400" />
            <StatCard label="Avg Trust Score" value={`${stats.avgTrust}/100`} icon={<TrendingUp size={20} />} accent="text-cyan-400" className="col-span-2 lg:col-span-1" />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Trust trend */}
            <div className={glassCard('p-5 lg:col-span-2')}>
              <h3 className="text-sm font-semibold text-white mb-4">Trust & Risk Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trustGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} />
                  <YAxis stroke="#ffffff40" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#0a0e14', border: '1px solid #ffffff20', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#ffffff60' }}
                  />
                  <Area type="monotone" dataKey="trust" stroke="#22d3ee" strokeWidth={2} fill="url(#trustGrad)" name="Trust Score" />
                  <Area type="monotone" dataKey="risk" stroke="#f87171" strokeWidth={2} fill="url(#riskGrad)" name="Risk Score" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution pie */}
            <div className={glassCard('p-5')}>
              <h3 className="text-sm font-semibold text-white mb-4">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {distributionData.map((entry, i) => (
                      <Cell key={i} fill={riskLevelHex(entry.name as any)} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0a0e14', border: '1px solid #ffffff20', borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {distributionData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                    <div className="w-2 h-2 rounded-full" style={{ background: riskLevelHex(d.name as any) }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis types bar chart */}
          <div className={glassCard('p-5')}>
            <h3 className="text-sm font-semibold text-white mb-4">Analysis Types</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} />
                <YAxis stroke="#ffffff40" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0a0e14', border: '1px solid #ffffff20', borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent analyses table */}
          <div className={glassCard('p-5')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Recent Analyses</h3>
              <Link to="/history" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-white/40 border-b border-white/[0.06]">
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-left py-2 px-3 font-medium">Identifier</th>
                    <th className="text-left py-2 px-3 font-medium">Trust Score</th>
                    <th className="text-left py-2 px-3 font-medium">Risk Level</th>
                    <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Date</th>
                    <th className="text-left py-2 px-3 font-medium hidden md:table-cell">Status</th>
                    <th className="text-right py-2 px-3 font-medium">View</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.slice(0, 10).map((a) => (
                    <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <span className="capitalize text-white/70">{a.analysis_type}</span>
                      </td>
                      <td className="py-3 px-3 text-white/70 max-w-[200px] truncate">{a.identifier}</td>
                      <td className="py-3 px-3">
                        <span className="tabular-nums font-medium text-white">{a.trust_score}/100</span>
                      </td>
                      <td className="py-3 px-3"><RiskBadge level={a.risk_level} /></td>
                      <td className="py-3 px-3 text-white/40 text-xs hidden md:table-cell">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="text-xs text-white/40 capitalize">{a.status}</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => navigate(`/analysis/${a.id}`)}
                          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
