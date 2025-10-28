import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Brain, Lightbulb, Loader2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface SimpleQuestion {
  id: string;
  text: string;
  trait: 'extraversion' | 'conscientiousness' | 'openness' | 'agreeableness' | 'neuroticism';
}

const simpleQuestions: SimpleQuestion[] = [
  { id: '1', text: 'I enjoy meeting new people', trait: 'extraversion' },
  { id: '2', text: 'I like detailed plans', trait: 'conscientiousness' },
  { id: '3', text: 'I act on new ideas fast', trait: 'openness' },
  { id: '4', text: 'I avoid conflict', trait: 'agreeableness' },
  { id: '5', text: 'I worry about small things', trait: 'neuroticism' },
];

interface PersonalityTestProps {
  questions?: any;
  onComplete: (result: any) => void;
  existingResult?: any;
}

export function PersonalityTest({ onComplete, existingResult }: PersonalityTestProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({
    extraversion: 3,
    conscientiousness: 3,
    openness: 3,
    agreeableness: 3,
    neuroticism: 3,
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedResult, setSavedResult] = useState<any>(null);

  // Load existing results from Supabase
  useEffect(() => {
    if (user) {
      loadExistingResult();
    }
  }, [user]);

  const loadExistingResult = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('personality_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      setAnswers({
        extraversion: data.extraversion,
        conscientiousness: data.conscientiousness,
        openness: data.openness,
        agreeableness: data.agreeableness,
        neuroticism: data.neuroticism,
      });
      setSavedResult(data);
      setShowResults(true);
    }
  };

  const handleSliderChange = (trait: string, value: number[]) => {
    setAnswers({ ...answers, [trait]: value[0] });
  };

  const generateLeadershipTip = (scores: typeof answers): string => {
    const highest = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b));
    const tips: Record<string, string> = {
      extraversion: 'High Extraversion? Use your energy to inspire teams!',
      conscientiousness: 'High Conscientiousness? Your planning skills are gold!',
      openness: 'High Openness? Try creative KPIs!',
      agreeableness: 'High Agreeableness? Your empathy builds trust!',
      neuroticism: 'Managing stress? Mindfulness helps leaders stay calm!',
    };
    return tips[highest[0]] || 'Keep growing your leadership skills!';
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to save your results');
      return;
    }

    setLoading(true);
    try {
      const tip = generateLeadershipTip(answers);

      const { data, error } = await supabase
        .from('personality_results')
        .insert({
          user_id: user.id,
          extraversion: answers.extraversion,
          conscientiousness: answers.conscientiousness,
          openness: answers.openness,
          agreeableness: answers.agreeableness,
          neuroticism: answers.neuroticism,
          leadership_tip: tip,
        })
        .select()
        .single();

      if (error) throw error;

      setSavedResult(data);
      setShowResults(true);
      toast.success('Personality test completed! 🌟');
      onComplete(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save results');
    } finally {
      setLoading(false);
    }
  };

  const retakeTest = () => {
    setShowResults(false);
    setAnswers({
      extraversion: 3,
      conscientiousness: 3,
      openness: 3,
      agreeableness: 3,
      neuroticism: 3,
    });
  };

  if (showResults && savedResult) {
    const radarData = [
      { trait: 'Extraversion', score: savedResult.extraversion },
      { trait: 'Conscientiousness', score: savedResult.conscientiousness },
      { trait: 'Openness', score: savedResult.openness },
      { trait: 'Agreeableness', score: savedResult.agreeableness },
      { trait: 'Emotional Stability', score: 6 - savedResult.neuroticism },
    ];

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Your Leadership Style
              </CardTitle>
              <CardDescription>
                Based on the Big Five personality traits
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={retakeTest}>
              Retake Test
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="trait" />
                <PolarRadiusAxis angle={90} domain={[0, 5]} />
                <Radar
                  name="Your Score"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Lightbulb className="h-5 w-5" />
              <h3 className="font-semibold">Leadership Tip</h3>
            </div>
            <p className="text-sm">{savedResult.leadership_tip}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Extraversion</p>
              <Badge variant="secondary">{savedResult.extraversion}/5</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Conscientiousness</p>
              <Badge variant="secondary">{savedResult.conscientiousness}/5</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Openness</p>
              <Badge variant="secondary">{savedResult.openness}/5</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Agreeableness</p>
              <Badge variant="secondary">{savedResult.agreeableness}/5</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Discover Your Leadership Style
        </CardTitle>
        <CardDescription>
          5 quick questions to understand your strengths
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {simpleQuestions.map((q) => (
          <div key={q.id} className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">{q.text}</label>
              <Badge variant="outline">{answers[q.trait]}</Badge>
            </div>
            <Slider
              value={[answers[q.trait]]}
              onValueChange={(value) => handleSliderChange(q.trait, value)}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Strongly Disagree</span>
              <span>Strongly Agree</span>
            </div>
          </div>
        ))}

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'See Results'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
