import { useState } from "react";
import { socraticTurn, type ConversationMessage } from "../../api";
import Header from "../../components/Layout/Header";
import ChatSidebar from "../../components/Sidebar/ChatSidebar";
import { useChatSessions } from "../../hooks/useChatSessions";


export default function Dashboard() {
  const {
    sessions,
    currentSessionId,
    messages,
    currentStep,
    setCurrentStep,
    createNewChat,
    selectSession,
    addMessage,
  } = useChatSessions();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const userContent = text.trim();
    setText("");  // Clear input immediately
    setLoading(true);
    setErr(null);

    try {
      // 1. ADD USER MESSAGE (await it and capture conversationId!)
      const result = await addMessage({
        type: 'user',
        content: userContent,
      });
      
      if (!result) return; // Guard clause if addMessage fails
      const { conversationId } = result;

      // 2. BUILD CONVERSATION HISTORY
      // Include the message we just added
      const conversationHistory: ConversationMessage[] = [
        ...messages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: userContent
        }
      ];

      // 3. GET AI RESPONSE
      const data = await socraticTurn({
        text: userContent,
        step: currentStep,
        conversation_history: conversationHistory,
      });

      if (data.step_id) {
        setCurrentStep(data.step_id);
      }

      // 4. ADD ASSISTANT MESSAGE (pass the conversationId explicitly!)
      await addMessage({
        type: 'assistant',
        content: `${data.assistant_message}\n\n${data.question}`,
        step: data.step_id,
        validation: data.validation,
        notes: data.notes,
      }, conversationId);

    } catch (error) {
      console.error('Error:', error);
      setErr(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={selectSession}
          onNewChat={createNewChat}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-4xl mx-auto w-full">
            {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Learning with Socratic Method</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Describe your programming problem or question. I'll guide you to discover the solution through thoughtful questions.
              </p>
            </div>
            ) : (
              messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  {message.type === 'assistant' && (message.step || message.notes) && (
                    <div className="flex gap-2 mb-2 text-xs">
                      {message.step && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          Step {message.step}
                        </span>
                      )}
                      {message.validation && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                          Validation
                        </span>
                      )}
                      {message.notes && message.notes.includes('category=') && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                          {message.notes.match(/category=(\w+)/)?.[1]}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border border-gray-200 rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={onSubmit} className="flex gap-3">
                <textarea
                value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  placeholder="Type your response..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 min-h-[40px] max-h-[120px] overflow-y-auto"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSubmit(e);
                    }
                  }}
                  required
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>

              {err && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">Error: {err}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}