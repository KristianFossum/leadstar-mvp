import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { MessageSquare, Send, Sparkles, User, Bot } from 'lucide-react';
import { format } from 'date-fns';
import type { ChatMessage } from '../../types/dashboard';

interface YouGrokChatProps {
  webhookUrl?: string;
}

export function YouGrokChat({ webhookUrl }: YouGrokChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hey! I'm your personal AI coach. Ask me anything about your goals, get advice on leadership challenges, or just chat about what's on your mind. How can I help you grow today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let responseContent: string;

      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            context: {
              type: 'you-view-chat',
              timestamp: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        responseContent = data.message || data.response || 'I received your message! How else can I help?';
      } else {
        responseContent = getMockResponse(userMessage.content);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. But I'm here to listen! Try asking me again, or check your webhook configuration.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMockResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('goal') || lowerInput.includes('objective')) {
      return "Great question about goals! Setting clear, achievable goals is crucial for growth. Based on your personality profile, I recommend breaking big goals into smaller milestones. What specific goal are you thinking about?";
    }

    if (lowerInput.includes('stress') || lowerInput.includes('overwhelm')) {
      return "I hear you - stress is tough! Your personality profile shows you handle pressure well, but everyone needs breaks. Try the 2-minute rule: if something takes less than 2 minutes, do it now. For bigger tasks, time-blocking can really help. Want some specific techniques?";
    }

    if (lowerInput.includes('team') || lowerInput.includes('leadership')) {
      return "Leadership questions are great! Your empathy and organizational skills are real strengths. Remember: great leaders listen more than they speak. Have you tried regular one-on-ones with your team? They're game-changers for building trust.";
    }

    if (lowerInput.includes('feedback') || lowerInput.includes('communication')) {
      return "Communication is key! When giving feedback, try the SBI method: Situation, Behavior, Impact. It keeps things objective and constructive. Your high agreeableness means you're naturally good at this - just make sure you're direct too!";
    }

    if (lowerInput.includes('time') || lowerInput.includes('productivity')) {
      return "Time management is all about priorities! Your conscientiousness is a superpower here. Try the Eisenhower Matrix: urgent vs important. And don't forget to schedule breaks - they boost productivity, not hurt it!";
    }

    if (lowerInput.includes('thank') || lowerInput.includes('thanks')) {
      return "You're so welcome! I'm here whenever you need support, advice, or just someone to bounce ideas off. Keep up the great work!";
    }

    return "That's an interesting point! I'm here to help you grow and succeed. Can you tell me more about what you're working on or what challenges you're facing? The more I know, the better I can support you.";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Your AI Coach
            </CardTitle>
            <CardDescription>
              Personalized guidance and support
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by Grok
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-purple-500 text-white'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`flex-1 max-w-[80%] ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(message.timestamp, 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="inline-block p-3 rounded-lg bg-muted">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex-shrink-0 p-6 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about goals, leadership, or personal growth..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {!webhookUrl && (
            <p className="text-xs text-muted-foreground mt-2">
              ℹ️ Configure VITE_GROK_WEBHOOK_URL for live AI responses
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
