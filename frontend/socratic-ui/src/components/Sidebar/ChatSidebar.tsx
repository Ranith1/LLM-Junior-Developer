import { useState } from 'react';
import type { ChatSession } from '../../types/chat';

interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  loading?: boolean;
}

export default function ChatSidebar({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession,
  loading = false
}: ChatSidebarProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDeleteSession(sessionId);
      setOpenMenuId(null);
    }
  };

  const toggleMenu = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the conversation
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-73px)] flex flex-col">
      {/* New Chat Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Chats</h3>
          
          {loading ? (
            // Loading skeleton
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-3 py-3 rounded-lg">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedSessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-gray-500 text-sm">
              No chats yet. Start a new conversation!
            </div>
          ) : (
            <div className="space-y-1">
              {sortedSessions.map((session) => (
                <div key={session.id} className="relative">
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                      currentSessionId === session.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.title || 'New Chat'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(session.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {session.messageCount > 0 && (
                          <span className="text-xs text-gray-500">
                            {session.messageCount}
                          </span>
                        )}
                        {/* Three-dot menu button */}
                        <button
                          onClick={(e) => toggleMenu(session.id, e)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          aria-label="Options"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
  <circle cx="3" cy="8" r="1.5"/>
  <circle cx="8" cy="8" r="1.5"/>
  <circle cx="13" cy="8" r="1.5"/>
</svg>
                        </button>
                      </div>
                    </div>
                  </button>

                  {/* Dropdown menu */}
                  {openMenuId === session.id && (
                    <>
                      {/* Backdrop to close menu when clicking outside */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setOpenMenuId(null)}
                      />
                      {/* Menu */}
                      <div className="absolute right-2 top-12 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}