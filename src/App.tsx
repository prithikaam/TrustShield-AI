import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { RouterProvider, useRouter } from '@/hooks/useRouter';
import { AppLayout } from '@/layouts/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProfileAnalyzerPage } from '@/pages/ProfileAnalyzerPage';
import { ContentAnalyzerPage } from '@/pages/ContentAnalyzerPage';
import { UrlAnalyzerPage } from '@/pages/UrlAnalyzerPage';
import { ImageAnalyzerPage } from '@/pages/ImageAnalyzerPage';
import { AnalysisResultPage } from '@/pages/AnalysisResultPage';
import { TrustHistoryPage } from '@/pages/TrustHistoryPage';
import { ReviewQueuePage } from '@/pages/ReviewQueuePage';
import { ReviewDetailPage } from '@/pages/ReviewDetailPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { IdentityGraphPage } from '@/pages/IdentityGraphPage';
import { LoadingSpinner } from '@/components/ui/StatCard';

function Routes() {
  const { path } = useRouter();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06090d] flex items-center justify-center">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (path === '/') return <LandingPage />;
  if (path === '/login') return session ? <DashboardPage /> : <LoginPage />;
  if (path === '/register') return session ? <DashboardPage /> : <RegisterPage />;

  if (!session) return <LoginPage />;

  let page: React.ReactNode;
  switch (path) {
    case '/dashboard': page = <DashboardPage />; break;
    case '/analyzer/profile': page = <ProfileAnalyzerPage />; break;
    case '/analyzer/content': page = <ContentAnalyzerPage />; break;
    case '/analyzer/url': page = <UrlAnalyzerPage />; break;
    case '/analyzer/image': page = <ImageAnalyzerPage />; break;
    case '/history': page = <TrustHistoryPage />; break;
    case '/identity-graph': page = <IdentityGraphPage />; break;
    case '/review': page = <ReviewQueuePage />; break;
    case '/settings': page = <SettingsPage />; break;
    default:
      if (path.startsWith('/analysis/')) {
        page = <AnalysisResultPage analysisId={path.split('/')[2]} />;
      } else if (path.startsWith('/review/')) {
        page = <ReviewDetailPage analysisId={path.split('/')[2]} />;
      } else if (path.startsWith('/identity-graph/')) {
        page = <IdentityGraphPage profileId={path.split('/')[2]} />;
      } else {
        page = <DashboardPage />;
      }
  }

  return <AppLayout>{page}</AppLayout>;
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <Routes />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
