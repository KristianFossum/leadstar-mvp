import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Brain, Lightbulb, Loader2, MessageCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { awardXP, XP_REWARDS } from '../../lib/gamification';
import { triggerLevelUpConfetti, triggerBadgeUnlockConfetti } from '../../lib/confetti';
import { useTheme, type PaletteType } from '../../contexts/ThemeContext';

interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'scale' | 'multiple' | 'text' | 'scenario';
  options?: string[];
  answer?: number | string;
}

interface PersonalityAnalyzerProps {
  onComplete?: (result: any) => void;
}

const scenarioQuestions = [
  {
    id: '1',
    question: "You're in a tough meeting where tensions are high. What's your instinct?",
    options: [
      { text: 'A) Speak up and address the issue directly', traits: { extraversion: 1, openness: 0.5 } },
      { text: 'B) Listen carefully and reflect before responding', traits: { extraversion: -1, conscientiousness: 1 } },
      { text: 'C) Plan a follow-up discussion for later', traits: { conscientiousness: 1, agreeableness: 0.5 } },
    ],
  },
  {
    id: '2',
    question: "A new challenge arises that you've never faced before. How do you approach it?",
    options: [
      { text: 'A) Dive in and experiment to figure it out', traits: { openness: 1, extraversion: 0.5 } },
      { text: 'B) Research proven methods and best practices first', traits: { conscientiousness: 1, openness: -0.5 } },
      { text: 'C) Ask others for advice and collaborate', traits: { agreeableness: 1, extraversion: 0.5 } },
    ],
  },
  {
    id: '3',
    question: "Your team disagrees on a major decision. What do you naturally do?",
    options: [
      { text: 'A) Push for what you believe is the best solution', traits: { extraversion: 1, neuroticism: -0.5 } },
      { text: 'B) Facilitate a compromise that everyone can accept', traits: { agreeableness: 1, conscientiousness: 0.5 } },
      { text: 'C) Step back and let the data guide the decision', traits: { conscientiousness: 1, openness: 0.5 } },
    ],
  },
  {
    id: '4',
    question: "You're planning your week ahead. What's your typical approach?",
    options: [
      { text: 'A) Create a detailed schedule with specific time blocks', traits: { conscientiousness: 1, neuroticism: 0.5 } },
      { text: 'B) Set a few key priorities and stay flexible', traits: { openness: 1, conscientiousness: -0.5 } },
      { text: 'C) Go with the flow and handle things as they come', traits: { openness: 1, extraversion: 0.5 } },
    ],
  },
  {
    id: '5',
    question: "Something goes wrong on an important project. How do you react?",
    options: [
      { text: 'A) Stay calm and focus on solutions immediately', traits: { neuroticism: -1, conscientiousness: 1 } },
      { text: 'B) Feel stressed but work through it systematically', traits: { neuroticism: 1, conscientiousness: 0.5 } },
      { text: 'C) Reach out to others for support and perspective', traits: { agreeableness: 1, extraversion: 0.5 } },
    ],
  },
];

export function PersonalityAnalyzer({ onComplete }: PersonalityAnalyzerProps) {
  const { user } = useAuth();
  const { suggestPaletteForPersonality, setPalette, saveSettings } = useTheme();
  const [step, setStep] = useState<'scenarios' | 'results'>('scenarios');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<string, number>>({});
  const [calculatedScores, setCalculatedScores] = useState<Record<string, number>>({
    extraversion: 3,
    conscientiousness: 3,
    openness: 3,
    agreeableness: 3,
    neuroticism: 3,
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadExistingResult();
    }
  }, [user]);

  const loadExistingResult = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('personality_results')
        .select('*')
        .eq('user_id', user.id)
        .order('update_date', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setCalculatedScores({
          extraversion: data.extraversion,
          conscientiousness: data.conscientiousness,
          openness: data.openness,
          agreeableness: data.agreeableness,
          neuroticism: data.neuroticism,
        });
        setResults(data);
        setStep('results');
      }
    } catch (error) {
      // No existing results
    }
  };

  const handleScenarioAnswer = async (optionIndex: number) => {
    const currentQuestion = scenarioQuestions[currentQuestionIndex];
    const selectedOption = currentQuestion.options[optionIndex];

    // Update answers
    const newAnswers = { ...scenarioAnswers, [currentQuestion.id]: optionIndex };
    setScenarioAnswers(newAnswers);

    // Calculate cumulative scores
    const newScores = { ...calculatedScores };
    Object.entries(selectedOption.traits).forEach(([trait, value]) => {
      newScores[trait] = Math.max(1, Math.min(5, newScores[trait] + value));
    });
    setCalculatedScores(newScores);

    // Award XP
    if (user) {
      const xpResult = await awardXP(user.id, XP_REWARDS.PERSONALITY_FOLLOWUP, 'personality_scenario');

      if (xpResult.success && !xpResult.leveledUp) {
        toast.success(`+${XP_REWARDS.PERSONALITY_FOLLOWUP} XP! 🧠`);
      }
    }

    // Move to next question or finish
    if (currentQuestionIndex < scenarioQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      generateFinalResults(newScores);
    }
  };

  const generateFinalResults = async (scores?: Record<string, number>) => {
    if (!user) return;

    const finalScores = scores || calculatedScores;
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_XAI_API_KEY;

      let aiComment = 'Great progress on your leadership journey!';
      let actionTip = 'Schedule a quiet reflection task this week.';
      let insights = 'Your personality profile shows strong leadership potential.';

      if (apiKey) {
        // Call xAI API for insights
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
                content: 'You are an empathetic leadership coach. Provide brief, motivating insights based on personality data from scenario-based questions.',
              },
              {
                role: 'user',
                content: `Based on instinct choices in 5 scenarios, calculated Big Five scores (1-5): Extraversion: ${finalScores.extraversion.toFixed(1)}, Conscientiousness: ${finalScores.conscientiousness.toFixed(1)}, Openness: ${finalScores.openness.toFixed(1)}, Agreeableness: ${finalScores.agreeableness.toFixed(1)}, Neuroticism: ${finalScores.neuroticism.toFixed(1)}. Provide: 1) Empathetic comment (15-20 words), 2) Actionable tip (15-20 words), 3) Key insight (25-30 words). Format as JSON: {comment, tip, insight}`,
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
            aiComment = parsed.comment || aiComment;
            actionTip = parsed.tip || actionTip;
            insights = parsed.insight || insights;
          }
        }
      }

      const { data, error } = await supabase
        .from('personality_results')
        .insert({
          user_id: user.id,
          extraversion: Math.round(finalScores.extraversion),
          conscientiousness: Math.round(finalScores.conscientiousness),
          openness: Math.round(finalScores.openness),
          agreeableness: Math.round(finalScores.agreeableness),
          neuroticism: Math.round(finalScores.neuroticism),
          follow_up_questions: scenarioAnswers,
          ai_comment: aiComment,
          action_tip: actionTip,
          insights: insights,
          update_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Award XP for completing personality profile update
      const xpResult = await awardXP(user.id, XP_REWARDS.PERSONALITY_UPDATE, 'personality_update');

      setResults(data);
      setStep('results');

      // Suggest palette based on personality
      const personalityData = {
        trait_scores: {
          extraversion: Math.round(finalScores.extraversion),
          conscientiousness: Math.round(finalScores.conscientiousness),
          openness: Math.round(finalScores.openness),
          agreeableness: Math.round(finalScores.agreeableness),
          neuroticism: Math.round(finalScores.neuroticism)
        }
      };

      const suggestedPalette = suggestPaletteForPersonality(personalityData);

      if (suggestedPalette) {
        const paletteNames = {
          motivate: 'Motivate',
          calm: 'Calm',
          power: 'Power'
        };
        const paletteEmojis = {
          motivate: '🚀',
          calm: '🌿',
          power: '⚡'
        };

        setTimeout(() => {
          toast.success(
            `We suggest ${paletteEmojis[suggestedPalette]} ${paletteNames[suggestedPalette]} palette for your ${getSuggestedStyle(suggestedPalette)} style!`,
            {
              duration: 6000,
              action: {
                label: 'Apply',
                onClick: async () => {
                  setPalette(suggestedPalette);
                  await saveSettings();
                  toast.success('Palette applied! ✨');
                }
              }
            }
          );
        }, 1500);
      }

      if (xpResult.success) {
        if (xpResult.leveledUp) {
          triggerLevelUpConfetti();
          toast.success(`Level ${xpResult.newLevel} Unlocked! Keep shining! 🎉`, {
            duration: 4000,
          });
        } else {
          toast.success(`Personality analysis complete! +${XP_REWARDS.PERSONALITY_UPDATE} XP earned! 🌟`);
        }

        // Show badge unlock toast if earned
        if (xpResult.unlockedBadge) {
          setTimeout(() => {
            triggerBadgeUnlockConfetti();
            toast.success(`🎖️ Badge Unlocked: ${xpResult.unlockedBadge!.emoji} ${xpResult.unlockedBadge!.name}`, {
              duration: 4000,
            });
          }, 500);
        }
      } else {
        toast.success('Personality analysis complete! 🌟');
      }

      if (onComplete) onComplete(data);
    } catch (error: any) {
      console.error('Error saving results:', error);
      toast.error(error.message || 'Failed to save results');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedStyle = (palette: PaletteType): string => {
    const styles = {
      motivate: 'creative and energetic',
      calm: 'mindful and balanced',
      power: 'bold and decisive'
    };
    return styles[palette] || 'unique';
  };

  const retakeTest = () => {
    setStep('scenarios');
    setCurrentQuestionIndex(0);
    setScenarioAnswers({});
    setCalculatedScores({
      extraversion: 3,
      conscientiousness: 3,
      openness: 3,
      agreeableness: 3,
      neuroticism: 3,
    });
    setResults(null);
  };

  if (step === 'results' && results) {
    const radarData = [
      { trait: 'Extraversion', score: results.extraversion },
      { trait: 'Conscientiousness', score: results.conscientiousness },
      { trait: 'Openness', score: results.openness },
      { trait: 'Agreeableness', score: results.agreeableness },
      { trait: 'Emotional Stability', score: 6 - results.neuroticism },
    ];

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Your Leadership Personality
              </CardTitle>
              <CardDescription>
                AI-enhanced personality analysis
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={retakeTest}>
              Retake Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Radar Chart */}
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Your Score"
                  dataKey="score"
                  stroke="#9333ea"
                  fill="#9333ea"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* AI Comment */}
          {results.ai_comment && (
            <div className="space-y-2 bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <MessageCircle className="h-4 w-4" />
                <h3 className="font-semibold text-sm">AI Insight</h3>
              </div>
              <p className="text-sm leading-relaxed">{results.ai_comment}</p>
            </div>
          )}

          {/* Action Tip */}
          {results.action_tip && (
            <div className="space-y-2 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Lightbulb className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Action Step</h3>
              </div>
              <p className="text-sm leading-relaxed">{results.action_tip}</p>
            </div>
          )}

          {/* Insights */}
          {results.insights && (
            <div className="space-y-2 bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Key Pattern</h3>
              </div>
              <p className="text-sm leading-relaxed">{results.insights}</p>
            </div>
          )}

          {/* Trait Scores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Extraversion</p>
              <Badge variant="secondary">{results.extraversion}/5</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Conscientiousness</p>
              <Badge variant="secondary">{results.conscientiousness}/5</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Openness</p>
              <Badge variant="secondary">{results.openness}/5</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Agreeableness</p>
              <Badge variant="secondary">{results.agreeableness}/5</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Scenario question UI
  const currentQuestion = scenarioQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / scenarioQuestions.length) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Instinct-Based Personality Analysis
        </CardTitle>
        <CardDescription>
          Question {currentQuestionIndex + 1} of {scenarioQuestions.length} - No right or wrong answers, just trust your gut
        </CardDescription>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground ml-3">Analyzing your profile...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <Label className="text-base font-semibold leading-relaxed text-purple-900 dark:text-purple-100">
                  {currentQuestion.question}
                </Label>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-4 px-5 hover:bg-purple-50 hover:border-purple-400 dark:hover:bg-purple-950/30 transition-all"
                    onClick={() => handleScenarioAnswer(index)}
                  >
                    <span className="text-sm leading-relaxed">{option.text}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center pt-4 border-t">
              <div className="flex gap-2">
                {scenarioQuestions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-2 rounded-full transition-all ${
                      idx < currentQuestionIndex
                        ? 'bg-green-600'
                        : idx === currentQuestionIndex
                        ? 'bg-purple-600 scale-125'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
