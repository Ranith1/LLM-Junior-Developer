import { useAuth } from '../../contexts/AuthContext';
import StudentProfile from './StudentProfile';
import SeniorProfile from './SeniorProfile';
import Header from '../../components/Layout/Header';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {user?.role === 'student' ? (
        <StudentProfile />
      ) : user?.role === 'senior' ? (
        <SeniorProfile />
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      )}
    </div>
  );
}
