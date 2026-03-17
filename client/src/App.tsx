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
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 p-8 border rounded-xl shadow-xl bg-card">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Auto Social AI</h1>
          <p className="text-muted-foreground italic text-sm">
            Secure Authentication active
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-muted-foreground">Full Name</label>
              <input
                required
                className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-muted-foreground">Email</label>
            <input
              required
              type="email"
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="demo@example.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-muted-foreground">Password</label>
            <input
              required
              type="password"
              className="w-full px-3 py-2 bg-background border rounded-md focus:ring-2 focus:ring-primary outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-sm">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
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