import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '@/store';
import { ProtectedRoute, PublicRoute } from '@/routes/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { FamiliesPage } from '@/pages/FamiliesPage';
import { FamilyTreePage } from '@/pages/FamilyTreePage';
import { FamilyCardPage } from '@/pages/FamilyCardPage';
import { MemberProfilePage } from '@/pages/MemberProfilePage';
import { EventsPage } from '@/pages/EventsPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { MemoriesPage } from '@/pages/MemoriesPage';
import { Toaster } from '@/components/ui/toaster';
import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  AuthCallbackPage,
} from '@/pages/AuthPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function ThemeInitializer() {
  const { theme, setTheme } = useThemeStore();
  useEffect(() => {
    setTheme(theme);
  }, []);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Auth routes that must work even with an active session (email links) */}
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/families" element={<FamiliesPage />} />
              <Route path="/tree" element={<FamilyTreePage />} />
              <Route path="/family/:headId" element={<FamilyCardPage />} />
              <Route path="/member/:memberId" element={<MemberProfilePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/memories" element={<MemoriesPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
