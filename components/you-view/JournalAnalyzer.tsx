import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Brain, MessageCircle, Lightbulb, TrendingUp, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { EnhancedJournalEntry } from '../../types/you-view';

interface JournalAnalyzerProps {
  journalEntry?: EnhancedJournalEntry;
  onClose?: () => void;
  onTaskSuggestion?: (task: { title: string; description: string }) => void;
}

interface AnalysisResult {
  patterns: string;
  followUpQuestions: Array<{
    question: string;
    options: string[];
    answer?: string;
  }>;
  aiComment?: string;
  actionTip?: string;
  linkedTraits?: string[];
}

export function JournalAnalyzer({ journalEntry, onClose, onTaskSuggestion }: JournalAnalyzerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (journalEntry && !analysis) {
      analyzeJournalEntry();
    }
  }, [journalEntry]);

  const analyzeJournalEntry = async () => {
    if (!journalEntry || !user) return;

    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_XAI_API_KEY;

      let patterns = 'Analyzing your journal patterns...';
      let followUpQuestions: any[] = [];
      let aiComment = 'Great reflection on your day!';
      let actionTip = 'Keep tracking your progress regularly.';
      let linkedTraits: string[] = [];

      if (apiKey) {
        // Get user's personality profile
        const { data: personalityData } = await supabase
          .from('personality_results')
          .select('*')
          .eq('user_id', user.id)
          .order('update_date', { ascending: false })
          .limit(1)
          .single();

        const personalityContext = personalityData
          ? `User personality: Extraversion ${personalityData.extraversion}, Conscientiousness ${personalityData.conscientiousness}, Openness ${personalityData.openness}, Agreeableness ${personalityData.agreeableness}, Neuroticism ${personalityData.neuroticism}.`
          : '';

        // Call xAI API
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'You are an empathetic leadership coach analyzing journal entries to identify patterns and provide supportive guidance.',
              },
              {
                role: 'user',
                content: `${personalityContext} Journal entry - Wins: ${journalEntry.wins.join(', ')}. Struggles: ${journalEntry.struggles.join(', ')}. Mood: ${journalEntry.mood}. Reflections: ${journalEntry.reflections}.

Provide JSON: {
  "patterns": "1-2 sentence pattern analysis linking to personality traits if available",
  "followUpQuestions": [{"question": "...", "options": ["A", "B", "C"]}] (2-3 scenario/reflection questions),
  "aiComment": "Empathetic comment (20-25 words)",
  "actionTip": "Actionable tip for calendar/goals (20-25 words)",
  "linkedTraits": ["trait names if patterns emerge"]
}`,
              },
            ],
            model: 'grok-beta',
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0]?.message?.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            patterns = parsed.patterns || patterns;
            followUpQuestions = parsed.followUpQuestions || [];
            aiComment = parsed.aiComment || aiComment;
            actionTip = parsed.actionTip || actionTip;
            linkedTraits = parsed.linkedTraits || [];
          }
        }
      } else {
        // Fallback analysis without API
        if (journalEntry.struggles.length > journalEntry.wins.length) {
          patterns = 'You faced more challenges today. This shows resilience in acknowledging difficulties.';
          linkedTraits = ['Conscientiousness', 'Emotional Awareness'];
        } else {
          patterns = 'Strong focus on wins today! This positive framing builds momentum.';
          linkedTraits = ['Openness', 'Optimism'];
        }

        followUpQuestions = [
          {
            question: 'If a similar situation happens tomorrow, how would you approach it?',
            options: ['Apply same strategy', 'Try a new approach', 'Seek team input'],
          },
          {
            question: 'Which of your core values guided your actions today?',
            options: ['Integrity', 'Growth', 'Collaboration'],
          },
        ];
      }

      setAnalysis({
        patterns,
        followUpQuestions,
        aiComment,
        actionTip,
        linkedTraits,
      });
    } catch (error) {
      console.error('Error analyzing journal:', error);
      toast.error('Failed to analyze journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = async (answer: string) => {
    if (!analysis || !user) return;

    const updatedQuestions = [...analysis.followUpQuestions];
    updatedQuestions[currentQuestionIndex].answer = answer;

    setAnalysis({ ...analysis, followUpQuestions: updatedQuestions });

    if (currentQuestionIndex < analysis.followUpQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Save analysis to personality_results
      try {
        const { error } = await supabase.from('personality_results').upsert({
          user_id: user.id,
          journal_patterns: analysis.patterns,
          ai_comment: analysis.aiComment,
          action_tip: analysis.actionTip,
          follow_up_questions: updatedQuestions,
          update_date: new Date().toISOString(),
        });

        if (error) throw error;

        toast.success('Analysis complete! 🌟');

        // Suggest task if actionTip is actionable
        if (onTaskSuggestion && analysis.actionTip) {
          onTaskSuggestion({
            title: 'Action from Journal Analysis',
            description: analysis.actionTip,
          });
        }
      } catch (error) {
        console.error('Error saving analysis:', error);
      }
    }
  };

  if (!journalEntry) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Journal Analyzer
          </CardTitle>
          <CardDescription>
            Feed a journal entry to get AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No journal entry selected for analysis.</p>
            <p className="text-sm mt-2">Click "Feed to Analyzer" on any journal entry.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Analyzing Your Journal
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Analyzing patterns and generating insights...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysis && currentQuestionIndex < analysis.followUpQuestions.length) {
    const currentQuestion = analysis.followUpQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / analysis.followUpQuestions.length) * 100;

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                Reflection Questions
              </CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {analysis.followUpQuestions.length}
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm font-medium leading-relaxed">{currentQuestion.question}</p>
          </div>

          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-purple-50 hover:border-purple-600"
                onClick={() => handleAnswerQuestion(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysis) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Analysis Complete
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Patterns */}
          <div className="space-y-2 bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-4 w-4" />
              <h3 className="font-semibold text-sm">Patterns Identified</h3>
            </div>
            <p className="text-sm leading-relaxed">{analysis.patterns}</p>
            {analysis.linkedTraits && analysis.linkedTraits.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {analysis.linkedTraits.map((trait, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {trait}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* AI Comment */}
          {analysis.aiComment && (
            <div className="space-y-2 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <MessageCircle className="h-4 w-4" />
                <h3 className="font-semibold text-sm">AI Insight</h3>
              </div>
              <p className="text-sm leading-relaxed">{analysis.aiComment}</p>
            </div>
          )}

          {/* Action Tip */}
          {analysis.actionTip && (
            <div className="space-y-2 bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Lightbulb className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Suggested Action</h3>
              </div>
              <p className="text-sm leading-relaxed">{analysis.actionTip}</p>
              {onTaskSuggestion && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onTaskSuggestion({
                      title: 'Action from Journal Analysis',
                      description: analysis.actionTip || '',
                    })
                  }
                  className="mt-2"
                >
                  Add to Calendar
                </Button>
              )}
            </div>
          )}

          {/* Answered Questions */}
          {analysis.followUpQuestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Your Reflections</h3>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {analysis.followUpQuestions.map((q, idx) => (
                    <div key={idx} className="bg-muted/30 p-3 rounded">
                      <p className="text-xs font-medium mb-1">{q.question}</p>
                      <p className="text-sm text-muted-foreground">{q.answer || 'No answer'}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
