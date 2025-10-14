import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth/Auth';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import SeniorAnalytics from './pages/Profile/SeniorAnalytics';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth Route - Default landing page */}
      <Route
        path="/"
        element={
          isAuthenticated ?
            <Navigate to="/dashboard" replace /> :
            <Auth />
        }
      />

      {/* Dashboard - Protected route */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ?
            <Dashboard /> :
            <Navigate to="/" replace />
        }
      />

      {/* Profile - Protected route */}
      <Route
        path="/profile"
        element={
          isAuthenticated ?
            <Profile /> :
            <Navigate to="/" replace />
        }
      />

      {/* Analytics page (senior can view any; student will view self via query userId=<their id>) */}
      <Route
        path="/profile/analytics"
        element={
          isAuthenticated ?
            <SeniorAnalytics /> :
            <Navigate to="/" replace />
        }
      />

      {/* Catch all other routes - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
