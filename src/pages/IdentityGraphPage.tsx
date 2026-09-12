import { useEffect, useState } from 'react';
import { Network, Users, Link2, Image as ImageIcon, AtSign, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/StatCard';
import { glassCard } from '@/lib/ui';
import { supabase } from '@/lib/supabase';

interface GraphNode {
  id: string;
  username: string;
  risk_score: number;
  x: number;
  y: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  confidence: number;
}

const relConfig: Record<string, { label: string; icon: any; color: string }> = {
  same_image: { label: 'Same Image', icon: ImageIcon, color: '#f87171' },
  same_domain: { label: 'Same Domain', icon: Link2, color: '#fbbf24' },
  similar_username: { label: 'Similar Username', icon: AtSign, color: '#22d3ee' },
  shared_contact: { label: 'Shared Contact', icon: Users, color: '#a78bfa' },
  similar_content: { label: 'Similar Content', icon: MessageSquare, color: '#34d399' },
};

export function IdentityGraphPage({ profileId }: { profileId?: string }) {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: profiles } = await supabase
        .from('analyzed_profiles')
        .select('id, username')
        .eq('user_id', user.id)
        .limit(20);

      if (!profiles || profiles.length === 0) { setLoading(false); return; }

      const profileIds = profiles.map((p) => p.id);
      const { data: analyses } = await supabase
        .from('analyses')
        .select('profile_id, risk_score')
        .in('profile_id', profileIds);

      const riskMap = new Map<string, number>();
      analyses?.forEach((a) => { if (a.profile_id) riskMap.set(a.profile_id, a.risk_score); });

      const { data: relationships } = await supabase
        .from('identity_relationships')
        .select('source_profile_id, target_profile_id, relationship_type, confidence')
        .in('source_profile_id', profileIds);

      const nodeCount = profiles.length;
      const radius = Math.max(150, nodeCount * 30);
      const centerX = 250;
      const centerY = 250;

      const graphNodes: GraphNode[] = profiles.map((p, i) => {
        const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
        return { id: p.id, username: p.username, risk_score: riskMap.get(p.id) ?? 0, x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
      });

      const graphEdges: GraphEdge[] = (relationships || []).map((r) => ({
        source: r.source_profile_id, target: r.target_profile_id, type: r.relationship_type, confidence: r.confidence,
      }));

      setNodes(graphNodes);
      setEdges(graphEdges);
      setLoading(false);
    })();
  }, [user, profileId]);

  if (loading) return <LoadingSpinner size={32} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Network size={24} className="text-cyan-400" /> Digital Identity Graph</h1>
        <p className="text-sm text-white/40 mt-1">Visual relationships between profiles based on available evidence</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-white/40 bg-white/[0.02] rounded-xl p-3 border border-white/[0.05]">
        Relationships are based only on available data. This does not claim real-world identity matches without evidence.
      </div>

      {nodes.length === 0 ? (
        <div className={glassCard('p-12 text-center')}>
          <Network size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No profiles or relationships to display yet.</p>
          <p className="text-sm text-white/30 mt-1">Analyze profiles to build the identity graph.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(relConfig).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const hasEdge = edges.some((e) => e.type === key);
              if (!hasEdge) return null;
              return <div key={key} className="flex items-center gap-1.5 text-xs text-white/50"><Icon size={14} style={{ color: cfg.color }} />{cfg.label}</div>;
            })}
          </div>

          <div className={glassCard('p-4 overflow-x-auto')}>
            <svg viewBox="0 0 500 500" className="w-full h-auto mx-auto" style={{ maxWidth: '100%', maxHeight: '70vh' }}>
              {edges.map((edge, i) => {
                const source = nodes.find((n) => n.id === edge.source);
                const target = nodes.find((n) => n.id === edge.target);
                if (!source || !target) return null;
                const cfg = relConfig[edge.type] || relConfig.similar_content;
                return (
                  <g key={i}>
                    <line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={cfg.color} strokeWidth={1.5} strokeOpacity={0.4} strokeDasharray="4 2" />
                    <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2} fill={cfg.color} fontSize={9} textAnchor="middle" opacity={0.6}>{cfg.label}</text>
                  </g>
                );
              })}
              {nodes.map((node) => {
                const color = node.risk_score >= 61 ? '#f87171' : node.risk_score >= 41 ? '#fbbf24' : '#34d399';
                return (
                  <g key={node.id}>
                    <circle cx={node.x} cy={node.y} r={28} fill="#0a0e14" stroke={color} strokeWidth={2} />
                    <text x={node.x} y={node.y - 2} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle">@{node.username.length > 8 ? node.username.slice(0, 8) + '...' : node.username}</text>
                    <text x={node.x} y={node.y + 12} fill={color} fontSize={9} textAnchor="middle">Risk: {node.risk_score}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {edges.length > 0 && (
            <div className={glassCard('p-5')}>
              <h3 className="text-sm font-semibold text-white mb-3">Detected Relationships</h3>
              <div className="space-y-2">
                {edges.map((edge, i) => {
                  const source = nodes.find((n) => n.id === edge.source);
                  const target = nodes.find((n) => n.id === edge.target);
                  if (!source || !target) return null;
                  const cfg = relConfig[edge.type] || relConfig.similar_content;
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <Icon size={16} style={{ color: cfg.color }} />
                      <span className="text-sm text-white/70">@{source.username}</span>
                      <span className="text-xs text-white/30">{'->'}</span>
                      <span className="text-sm text-white/70">@{target.username}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/[0.04] text-white/50 ml-auto">{cfg.label} - {Math.round(edge.confidence * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
