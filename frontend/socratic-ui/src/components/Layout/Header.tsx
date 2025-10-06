import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="w-full px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 
            className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => navigate('/dashboard')}
          >
            Socratic Mentor
          </h1>
          {user && (
            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {user.role === 'student' ? '👨‍🎓 Student' : '👨‍💻 Senior Developer'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {user && (
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
