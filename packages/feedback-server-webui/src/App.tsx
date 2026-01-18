/**
 * @file App Component
 *
 * Main application component with routing and protected routes.
 *
 * TASK-WUI-024: Enhanced with auth loading state
 * TASK-WUI-025: Protected route wrapper with role support
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, useRequireRole, type UserRole } from "./stores";
import { Layout } from "./components/Layout";
import { Loader2 } from "lucide-react";

// Pages
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { FeedbackListPage } from "./pages/FeedbackList";
import { FeedbackDetailPage } from "./pages/FeedbackDetail";
import { SettingsPage } from "./pages/Settings";

/**
 * Loading screen shown while auth state is being restored
 */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Access denied screen for role-based access control
 */
function AccessDeniedScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You don't have permission to access this page.
        </p>
        <a
          href="/dashboard"
          className="text-primary hover:underline"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}

/**
 * Protected route wrapper - redirects to login if not authenticated
 *
 * TASK-WUI-025: Enhanced with loading state and role support
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | undefined;
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAccess } = useRequireRole(requiredRole ?? "viewer");

  // Show loading screen while auth state is being restored
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole && !hasAccess) {
    return <AccessDeniedScreen />;
  }

  return <>{children}</>;
}

/**
 * Main application component with routing
 */
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="feedback" element={<FeedbackListPage />} />
        <Route path="feedback/:id" element={<FeedbackDetailPage />} />
        {/* Settings requires admin role */}
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredRole="admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
