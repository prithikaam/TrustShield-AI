import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, UserSearch, FileText, Link2, Image, History,
  ClipboardCheck, Settings, LogOut, Menu, ChevronRight, Network,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, Link } from '@/hooks/useRouter';
import { Logo } from '@/components/ui/Logo';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analyzer/profile', label: 'Profile Analyzer', icon: UserSearch },
  { path: '/analyzer/content', label: 'Content Analyzer', icon: FileText },
  { path: '/analyzer/url', label: 'URL Analyzer', icon: Link2 },
  { path: '/analyzer/image', label: 'Image Analyzer', icon: Image },
  { path: '/history', label: 'Trust History', icon: History },
  { path: '/identity-graph', label: 'Identity Graph', icon: Network },
  { path: '/review', label: 'Review Queue', icon: ClipboardCheck },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { path, navigate } = useRouter();
  const { signOut, profile, role } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (itemPath: string) =>
    path === itemPath || (itemPath !== '/dashboard' && path.startsWith(itemPath));

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link to="/dashboard" onClick={() => setSidebarOpen(false)}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/10 text-cyan-400 border border-cyan-400/20'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight size={14} className="ml-auto" />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-white truncate">{profile?.full_name || 'User'}</div>
            <div className="text-xs text-white/40 capitalize">{role}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#06090d] text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-white/[0.06] bg-[#080b11] sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-[#080b11] border-r border-white/[0.06] h-full">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#080b11]/90 backdrop-blur-xl border-b border-white/[0.06]" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-white/60 hover:text-white touch-manipulation">
            <Menu size={22} />
          </button>
          <Logo size="sm" />
          <div className="w-8" />
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1400px] w-full mx-auto" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
