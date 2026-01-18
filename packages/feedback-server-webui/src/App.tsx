import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/auth";
import { Layout } from "./components/Layout";

// Pages
import { LoginPage } from "./pages/Login";
import { DashboardPage } from "./pages/Dashboard";
import { FeedbackListPage } from "./pages/FeedbackList";
import { FeedbackDetailPage } from "./pages/FeedbackDetail";
import { SettingsPage } from "./pages/Settings";

/**
 * Protected route wrapper - redirects to login if not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
