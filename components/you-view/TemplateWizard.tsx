import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Rocket, Users, Lightbulb, CheckCircle, Mic } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface TemplateWizardProps {
  onComplete: () => void;
}

interface QuestionAnswer {
  role?: string;
  goal?: string;
  stage?: string;
}

const templates = [
  {
    id: 'Starter' as const,
    icon: Rocket,
    title: 'Starter',
    description: 'Building your foundation',
    features: [
      'Daily Wins focus',
      'Soft, motivating language',
      'Basic goal tracking',
      'Habit building emphasis',
    ],
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 'Manager' as const,
    icon: Users,
    title: 'Manager',
    description: 'Leading teams effectively',
    features: [
      'Team Impact KPIs',
      'Communication goals',
      '1-on-1 scheduling',
      'Leadership insights',
    ],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'Entrepreneur' as const,
    icon: Lightbulb,
    title: 'Entrepreneur',
    description: 'Scaling your vision',
    features: [
      'Vision Scale tracking',
      'Innovation KPIs',
      'Big goal management',
      'Growth hacking tips',
    ],
    color: 'from-purple-500 to-pink-600',
  },
];

export function TemplateWizard({ onComplete }: TemplateWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'questions' | 'templates'>('questions');
  const [answers, setAnswers] = useState<QuestionAnswer>({});
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selected, setSelected] = useState<typeof templates[0] | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string>('');

  const startVoiceInput = async () => {
    // Check if speech recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice input not supported in your browser. Please type instead.');
      return;
    }

    // Request microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Allow microphone in browser settings - type for now');
      } else {
        toast.error('Microphone not available - type instead');
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast('Listening...', { duration: 2000 });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      toast.success('Got it! Review and continue.');
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        toast.error('Allow mic in settings - type for now');
      } else if (event.error === 'no-speech') {
        toast.error('No speech detected - try again');
      } else {
        toast.error('Voice failed - type instead');
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
      toast.error('Voice input failed - type instead');
    }
  };

  const analyzeAnswers = async () => {
    setLoading(true);
    try {
      // Simple rule-based recommendation
      const input = userInput.toLowerCase();

      let recommendedTemplate: typeof templates[0];
      let reason = '';

      if (input.includes('start') || input.includes('begin') || input.includes('new') || input.includes('habit')) {
        recommendedTemplate = templates[0]; // Starter
        reason = 'Based on your focus on starting fresh and building habits, Starter mode is perfect for you!';
      } else if (input.includes('team') || input.includes('manage') || input.includes('lead') || input.includes('1-on-1')) {
        recommendedTemplate = templates[1]; // Manager
        reason = 'Your team leadership goals align perfectly with Manager mode!';
      } else if (input.includes('scale') || input.includes('innovate') || input.includes('grow') || input.includes('entrepreneur')) {
        recommendedTemplate = templates[2]; // Entrepreneur
        reason = 'Your vision for scaling and innovation makes Entrepreneur mode ideal!';
      } else {
        recommendedTemplate = templates[0]; // Default to Starter
        reason = 'Starting with Starter mode - you can always switch later!';
      }

      setSelected(recommendedTemplate);
      setRecommendation(reason);
      setStep('templates');
    } catch (error) {
      console.error('Error analyzing answers:', error);
      toast.error('Failed to analyze - please select manually');
      setStep('templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async () => {
    if (!selected || !user) return;

    setLoading(true);

    try {
      // Save template to user_settings
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingSettings) {
        await supabase
          .from('user_settings')
          .update({
            template: selected.id,
            onboarding_complete: true
          })
          .eq('user_id', user.id);
      } else {
        await supabase.from('user_settings').insert([
          {
            user_id: user.id,
            template: selected.id,
            onboarding_complete: true,
            pillar_order: null,
            pillar_collapsed: {},
          },
        ]);
      }

      // Initialize gamification if not exists
      const { data: existingGam } = await supabase
        .from('gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingGam) {
        await supabase.from('gamification').insert([
          {
            user_id: user.id,
            total_xp: 0,
            current_level: 1,
            streak_count: 0,
            badges_unlocked: [],
            last_activity_date: new Date().toISOString().split('T')[0],
          },
        ]);
      }

      // Add welcome XP
      if (existingGam) {
        await supabase
          .from('gamification')
          .update({
            total_xp: (existingGam.total_xp || 0) + 50,
          })
          .eq('user_id', user.id);
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      const messages = {
        Starter: 'Welcome! Your curiosity is super – build it with small wins! 🌱',
        Manager: 'Welcome! Your team leadership journey starts now! 👔',
        Entrepreneur: 'Welcome! Time to chase those big goals! 🚀',
      };

      toast.success(`${messages[selected.id]} +50 XP`);
      onComplete();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="bg-[#1e1e1e] border-gray-800 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {step === 'questions' ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to YOU</h2>
              <p className="text-gray-400">
                Let's personalize your experience. Tell me about your role, goal, and stage.
              </p>
            </div>

            <div className="max-w-2xl mx-auto mb-8">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                What's your current role and what are you aiming to achieve?
              </label>
              <div className="flex gap-3">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="E.g., I'm starting my journey as a team lead and want to build better habits..."
                  className="flex-1 p-4 bg-[#121212] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none h-32"
                />
                <button
                  onClick={startVoiceInput}
                  disabled={isListening}
                  className={`flex-shrink-0 p-4 rounded-lg transition-all ${
                    isListening
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  title="Voice input"
                >
                  <Mic className="h-6 w-6 text-white" />
                </button>
              </div>
              {isListening && (
                <p className="text-sm text-purple-400 mt-2 text-center">Listening...</p>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={analyzeAnswers}
                disabled={!userInput.trim() || loading}
                className="px-8 py-3 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Continue →'}
              </Button>
              <Button
                onClick={() => setStep('templates')}
                variant="outline"
                className="px-6 py-3 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Skip
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Choose Your Path</h2>
              <p className="text-gray-400">
                {recommendation || 'Select a template to personalize your experience. You can change this anytime.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {templates.map((template) => {
                const Icon = template.icon;
                const isSelected = selected?.id === template.id;

                return (
                  <button
                    key={template.id}
                    onClick={() => setSelected(template)}
                    className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 scale-105'
                        : 'border-gray-700 bg-[#121212] hover:border-gray-600'
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle className="absolute top-4 right-4 h-6 w-6 text-purple-400" />
                    )}

                    <div
                      className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${template.color} mb-4`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{template.title}</h3>
                    <p className="text-sm text-gray-400 mb-4">{template.description}</p>

                    <ul className="space-y-2">
                      {template.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-green-400 mt-0.5">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleSelect}
                disabled={!selected || loading}
                className="px-8 py-3 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {loading ? 'Setting up...' : "Let's Go! 🚀"}
              </Button>
              <Button
                onClick={() => setStep('questions')}
                variant="outline"
                className="px-6 py-3 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                ← Back
              </Button>
            </div>

            {selected && (
              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-300 text-center">
                  <strong>{selected.title}</strong> will customize your pillars, spotlights, and coach
                  missions to match your journey.
                </p>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
