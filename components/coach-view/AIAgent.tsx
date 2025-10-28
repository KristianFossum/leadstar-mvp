import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { analyzeUserInput, getUserData, type AgentAction } from '@/services/grokService';
import { executeAgentActions } from '@/services/agentActionsService';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export function AIAgent() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'agent'; message: string }>>([]);
  const recognitionRef = useRef<any>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          toast.error('Voice not supported — type instead');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversation]);

  const toggleVoiceInput = async () => {
    if (!recognitionRef.current) {
      toast.error('Voice not supported — type instead');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        // Request microphone permission first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
          } catch (permissionError: any) {
            console.error('Microphone permission denied:', permissionError);
            toast.error('Allow mic in browser settings — type for now');
            return;
          }
        }

        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start voice input:', error);
        setIsListening(false);
        toast.error('Voice not supported — type instead');
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !user || isProcessing) return;

    const userInput = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', message: userInput }]);

    try {
      // Get all user data
      const userData = await getUserData(user.id);

      // Analyze input with Grok
      const agentResponse = await analyzeUserInput(user.id, userInput, userData);

      // Execute actions
      const results = await executeAgentActions(user.id, agentResponse.actions);

      // Add agent response to conversation
      setConversation(prev => [...prev, { role: 'agent', message: agentResponse.response }]);

      // Show feedback
      const totalXP = results.reduce((sum, r) => sum + (r.xp || 0), 0);
      if (totalXP > 0) {
        toast.success(`+${totalXP} XP earned!`, {
          description: results.map(r => r.message).join(' • '),
          style: {
            background: colors.accent,
            color: '#fff'
          }
        });
      }

      // Show badges
      const badges = results.filter(r => r.badge);
      if (badges.length > 0) {
        badges.forEach(b => {
          toast.success(`🏆 Badge Unlocked: ${b.badge}!`, {
            style: {
              background: colors.accent,
              color: '#fff'
            }
          });
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      // Show follow-up question
      if (agentResponse.followUp) {
        setTimeout(() => {
          setConversation(prev => [...prev, { role: 'agent', message: agentResponse.followUp! }]);
        }, 1000);
      }
    } catch (error) {
      console.error('Agent error:', error);
      toast.error('Failed to process your input. Please try again.');
      setConversation(prev => [...prev, {
        role: 'agent',
        message: 'Sorry, I encountered an issue. Please try again.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Conversation Window */}
      {conversation.length > 0 && (
        <div className="mb-4 w-96 max-w-[calc(100vw-3rem)] bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">AI Agent</h3>
          </div>

          {/* Messages */}
          <div
            ref={conversationRef}
            className="max-h-96 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
          >
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-100 px-4 py-2 rounded-2xl">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="w-96 max-w-[calc(100vw-3rem)] bg-[#1e1e1e] rounded-2xl shadow-2xl border border-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Voice Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={isProcessing}
            className={`p-3 rounded-full transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Finished workout — 5km run, felt strong'}
            disabled={isProcessing || isListening}
            className="flex-1 bg-gray-800 text-white placeholder-gray-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        {/* Status */}
        {isListening && (
          <p className="text-xs text-gray-400 mt-2 text-center animate-pulse">
            🎤 Listening... Speak now
          </p>
        )}
      </div>
    </div>
  );
}
