import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth/Auth';
import Dashboard from './pages/Dashboard/Dashboard';

// Simple mock auth hook - replace with real implementation later
const useAuth = () => {
  // For now, we'll just check if there's a simple flag in localStorage
  // This is just for demo purposes - implement proper auth later
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  return { isAuthenticated };
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
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
        
        {/* Catch all other routes - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;