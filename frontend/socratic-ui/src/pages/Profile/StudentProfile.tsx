// src/pages/Profile/StudentProfile.tsx
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
              👨‍🎓
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                Student Account
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-6 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* My Analytics Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">My Analytics</h3>
        </div>
        <p className="text-gray-600 mb-4">
          View your analytics, these include conversation durations, most used words
          and more!
        </p>
        <button
          onClick={() => navigate('/profile/analytics')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          aria-label="View my analytics"
        >
          View My Analytics
        </button>
      </div>
    </div>
  );
}
