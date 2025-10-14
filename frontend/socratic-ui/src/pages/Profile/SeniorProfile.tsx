import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMyAssignedRequests, updateHelpRequestStatus, type HelpRequest } from '../../api';

export default function SeniorProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHelpRequests();
  }, []);

  const loadHelpRequests = async () => {
    try {
      setLoading(true);
      const result = await getMyAssignedRequests();
      setHelpRequests(result.helpRequests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load help requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'contacted' | 'resolved') => {
    try {
      await updateHelpRequestStatus(requestId, status);
      await loadHelpRequests();
    } catch (err) {
      alert('Failed to update status: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
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

        {/* Small analytics form */}
        <div className="mt-6 flex items-center gap-2">
          <input
            id="studentId"
            placeholder="Enter Student User ID"
            className="border rounded px-3 py-2 w-80"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const id = (e.target as HTMLInputElement).value.trim();
                if (id) navigate(`/profile/analytics?userId=${encodeURIComponent(id)}`);
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.getElementById('studentId') as HTMLInputElement | null;
              const id = input?.value.trim();
              if (id) navigate(`/profile/analytics?userId=${encodeURIComponent(id)}`);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* Help Requests Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Student Help Requests</h3>
          <button
            onClick={loadHelpRequests}
            className="px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        ) : helpRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-600">No pending help requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {helpRequests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                      👨‍🎓
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{request.student_name}</h4>
                      <p className="text-sm text-gray-600">{request.student_email}</p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Problem:</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {request.problem_description}
                  </p>
                </div>

                <details className="mb-3">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-purple-600">
                    View Conversation History
                  </summary>
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {request.conversation_summary}
                  </div>
                </details>

                <div className="flex gap-2">
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'contacted')}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Mark as Contacted
                    </button>
                  )}
                  {request.status === 'contacted' && (
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'resolved')}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
