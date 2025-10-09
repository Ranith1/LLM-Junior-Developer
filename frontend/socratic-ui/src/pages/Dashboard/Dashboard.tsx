import { useState, useEffect } from "react";
import { socraticTurn, createHelpRequest, getHelpRequestByConversation, type ConversationMessage } from "../../api";
import Header from "../../components/Layout/Header";
import ChatSidebar from "../../components/Sidebar/ChatSidebar";
import ContactSeniorModal from "../../components/ContactSeniorModal";
import { useChatSessions } from "../../hooks/useChatSessions";
import { useAuth } from "../../contexts/AuthContext";


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
    deleteSession,
  } = useChatSessions();
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showContactSeniorModal, setShowContactSeniorModal] = useState(false);
  const [step6Detected, setStep6Detected] = useState(false);
  const [conversationHasHelpRequest, setConversationHasHelpRequest] = useState(false);
  const [helpRequestStatus, setHelpRequestStatus] = useState<'pending' | 'contacted' | 'resolved' | 'cancelled' | null>(null);


  // Check if current conversation has a help request (ONLY FOR STUDENTS)
  useEffect(() => {
    const checkHelpRequest = async () => {
      // Don't check for senior engineers - they should always have input access
      if (!currentSessionId || user?.role !== 'student') {
        setConversationHasHelpRequest(false);
        setHelpRequestStatus(null);
        return;
      }

      try {
        const result = await getHelpRequestByConversation(currentSessionId);
        setConversationHasHelpRequest(result.hasHelpRequest);
        setHelpRequestStatus(result.helpRequest?.status || null);
      } catch (error) {
        console.error('Error checking help request:', error);
        setConversationHasHelpRequest(false);
        setHelpRequestStatus(null);
      }
    };

    checkHelpRequest();
  }, [currentSessionId, user]);

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

        // Check if we've reached Step 6
        if (data.step_id === 6) {
          setStep6Detected(true);
        }
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

  const handleContactSenior = async (problemDescription: string) => {
    if (!currentSessionId) {
      throw new Error('No active conversation');
    }

    const result = await createHelpRequest(currentSessionId, problemDescription);

    // Show success message
    alert(`Help request sent! ${result.helpRequest.assignedSenior.name} will contact you at your email soon.`);
    setStep6Detected(false);
    setConversationHasHelpRequest(true);
  };

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
          onDeleteSession={deleteSession}
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
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${message.type === 'user'
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
                    <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
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



            {/* Step 6 Contact Senior Banner - ONLY FOR STUDENTS */}
            {step6Detected && currentStep === 6 && user?.role === 'student' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 mb-1">Need Extra Help?</h4>
                    <p className="text-sm text-purple-800 mb-3">
                      We can connect you with a senior engineer who will work with you one-on-one to solve this problem.
                    </p>
                    <button
                      onClick={() => setShowContactSeniorModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      Contact Senior Engineer
                    </button>
                  </div>
                  <button
                    onClick={() => setStep6Detected(false)}
                    className="text-purple-400 hover:text-purple-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              {conversationHasHelpRequest ? (
                // Show different messages based on status
                <div className={`rounded-lg p-4 ${helpRequestStatus === 'resolved'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-purple-50 border border-purple-200'
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${helpRequestStatus === 'resolved'
                      ? 'bg-green-100'
                      : 'bg-purple-100'
                      }`}>
                      <svg className={`w-5 h-5 ${helpRequestStatus === 'resolved' ? 'text-green-600' : 'text-purple-600'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {helpRequestStatus === 'resolved' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1">
                      {helpRequestStatus === 'resolved' ? (
                        <>
                          <h4 className="font-semibold text-green-900 mb-1">Problem Resolved</h4>
                          <p className="text-sm text-green-800 mb-3">
                            This issue has been resolved by a senior engineer. This conversation is now archived for your reference.
                          </p>
                          <button
                            onClick={createNewChat}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Start New Conversation
                          </button>
                        </>
                      ) : (
                        <>
                          <h4 className="font-semibold text-purple-900 mb-1">
                            {helpRequestStatus === 'contacted' ? 'Engineer Working on Your Problem' : 'Senior Engineer Contacted'}
                          </h4>
                          <p className="text-sm text-purple-800">
                            A senior engineer has been notified about your problem and will reach out to you via email to help resolve this issue. Please check your email for their response.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Normal input when no help request
                <>
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
                </>
              )}
            </div>
          </div>


        </div>
      </div>
      {/* Contact Senior Modal */}
      <ContactSeniorModal
        isOpen={showContactSeniorModal}
        onClose={() => setShowContactSeniorModal(false)}
        onConfirm={handleContactSenior}
        conversationId={currentSessionId || ''}
      />
    </div>
  );
}