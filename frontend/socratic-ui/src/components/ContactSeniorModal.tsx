import { useState } from 'react';

interface ContactSeniorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (problemDescription: string) => Promise<void>;
  conversationId: string;
}

export default function ContactSeniorModal({
  isOpen,
  onClose,
  onConfirm,
  conversationId
}: ContactSeniorModalProps) {
  const [problemDescription, setProblemDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!problemDescription.trim()) {
      setError('Please describe your problem');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(problemDescription);
      setProblemDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Contact Senior Engineer</h3>
            <p className="text-sm text-gray-600">Get help from an experienced developer</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 mb-3">
            A senior engineer will review your problem and contact you via email to work through it together.
          </p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Briefly describe your problem: <span className="text-red-500">*</span>
          </label>
          <textarea
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="E.g., I'm having trouble understanding how to implement recursion in my algorithm..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900"
            rows={4}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !problemDescription.trim()}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              'Request Help'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}