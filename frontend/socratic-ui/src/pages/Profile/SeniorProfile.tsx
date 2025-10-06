import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SeniorProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-3xl">
              👨‍💻
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                Senior Developer Account
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
