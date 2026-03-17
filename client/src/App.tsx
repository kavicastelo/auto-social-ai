import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import api from './lib/api';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ContentStudioPage } from './pages/ContentStudioPage';
import { PostSchedulerPage } from './pages/PostSchedulerPage';
import { AutomationPipelinesPage } from './pages/AutomationPipelinesPage';
import { PagesManagerPage } from './pages/PagesManagerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { MediaLibraryPage } from './pages/MediaLibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    name: '',
    email: 'demo@example.com',
    password: 'password123',
  });

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && !authLoading) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await api.post(endpoint, payload);
      const { tokens } = response.data.data;

      if (tokens?.accessToken) {
        login(tokens.accessToken);
        // Navigation will be handled by the useEffect once user state updates
      } else {
        throw new Error('No access token received');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Authentication failed';
      setError(msg);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-background to-background px-4 py-12">
      <div className="w-full max-w-[440px] relative">
        {/* Background Decor */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative space-y-8 p-8 md:p-10 border border-border/50 rounded-3xl shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />
          
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="text-2xl font-black text-white italic">A</span>
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {isLogin ? 'Sign in to access your social hub' : 'Start your journey with Auto Social AI'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold text-center animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                <div className="relative">
                  <input
                    required
                    className="w-full h-12 px-4 bg-background/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 outline-none transition-all placeholder:text-muted-foreground/40"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
              <input
                required
                type="email"
                className="w-full h-12 px-4 bg-background/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 outline-none transition-all placeholder:text-muted-foreground/40"
                placeholder="demo@example.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Password</label>
                {isLogin && <button type="button" className="text-[10px] font-bold text-violet-600 hover:text-violet-500">Forgot Password?</button>}
              </div>
              <input
                required
                type="password"
                className="w-full h-12 px-4 bg-background/50 border border-border/50 rounded-xl focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 outline-none transition-all placeholder:text-muted-foreground/40"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-violet-500/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Processing
                </div>
              ) : isLogin ? 'Sign In Securely' : 'Launch Account'}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
            >
              {isLogin ? (
                <>New here? <span className="text-violet-600 group-hover:text-violet-500 transition-colors">Create an account</span></>
              ) : (
                <>Already a member? <span className="text-violet-600 group-hover:text-violet-500 transition-colors">Sign in here</span></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-[10px] text-muted-foreground font-medium">
          Protected by industry-standard encryption. By continuing, you agree to our Terms.
        </p>
      </div>
    </div>
  );
}

function MainApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/content" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ContentStudioPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/scheduler" element={
        <ProtectedRoute>
          <DashboardLayout>
            <PostSchedulerPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pipelines" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AutomationPipelinesPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pages" element={
        <ProtectedRoute>
          <DashboardLayout>
            <PagesManagerPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/analytics" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AnalyticsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/media" element={
        <ProtectedRoute>
          <DashboardLayout>
            <MediaLibraryPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Toaster richColors position="top-right" theme="system" />
            <MainApp />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}