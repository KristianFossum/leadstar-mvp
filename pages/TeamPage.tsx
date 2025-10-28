import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Users, MessageSquare, Lightbulb, Shield, TrendingUp, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface TeamInsight {
  id: string;
  role: 'employee' | 'leader';
  input: string;
  ai_suggestion: string;
  scenario?: string;
  created_at: string;
  is_shared: boolean;
}

export function TeamPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<'employee' | 'leader' | null>(null);
  const [input, setInput] = useState('');
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<TeamInsight[]>([]);
  const [showScenario, setShowScenario] = useState(false);

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('team_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setInsights(data);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const generateSuggestion = async () => {
    if (!role || !input.trim()) {
      toast.error('Please select a role and provide input');
      return;
    }

    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_XAI_API_KEY;
      let aiSuggestion = 'Great input! Fostering open communication builds trust.';

      if (apiKey) {
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
                content: 'You are an empathetic team dynamics coach. Provide balanced, actionable suggestions for both employees and leaders. Be brief (2-3 sentences) and optimistic.',
              },
              {
                role: 'user',
                content: `Role: ${role}. Input: "${input}". ${scenario ? `Scenario: "${scenario}".` : ''} Provide a balanced suggestion that helps both sides understand each other.`,
              },
            ],
            model: 'grok-beta',
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiSuggestion = data.choices[0]?.message?.content || aiSuggestion;
        }
      }

      // Save to Supabase
      const { error } = await supabase.from('team_insights').insert({
        user_id: user!.id,
        role,
        input,
        ai_suggestion: aiSuggestion,
        scenario: scenario || null,
        is_shared: false,
      });

      if (error) throw error;

      toast.success('Insight generated! 🎯');
      setInput('');
      setScenario('');
      setRole(null);
      setShowScenario(false);
      await loadInsights();
    } catch (error: any) {
      console.error('Error generating suggestion:', error);
      toast.error(error.message || 'Failed to generate insight');
    } finally {
      setLoading(false);
    }
  };

  const deleteInsight = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('team_insights').delete().eq('id', id).eq('user_id', user.id);

      if (error) throw error;

      toast.success('Insight removed');
      await loadInsights();
    } catch (error: any) {
      console.error('Error deleting insight:', error);
      toast.error(error.message || 'Failed to delete insight');
    }
  };

  const scenarios = [
    'Team conflict over priorities',
    'Communication breakdown',
    'Low team morale',
    'Unclear expectations',
    'Work-life balance issues',
    'Performance concerns',
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Insight Synergy
          </h1>
          <p className="text-gray-400 mt-2">Anonymous team insights powered by AI</p>
        </div>

        {/* Info Card */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-purple-400" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Share thoughts anonymously as an employee or leader</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>AI analyzes and provides balanced suggestions for both perspectives</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>Optional scenario simulations to practice tough conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span>All insights are private until you choose to share</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Input Card */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Share Your Perspective</CardTitle>
            <CardDescription className="text-gray-400">
              Get AI-powered insights to improve team dynamics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Selection */}
            <div>
              <Label className="text-gray-300 mb-3 block">I'm sharing as:</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRole('employee')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === 'employee'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-[#121212] hover:border-gray-600'
                  }`}
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                  <div className="font-semibold text-white">Team Member</div>
                </button>
                <button
                  onClick={() => setRole('leader')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    role === 'leader'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-[#121212] hover:border-gray-600'
                  }`}
                >
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                  <div className="font-semibold text-white">Leader</div>
                </button>
              </div>
            </div>

            {/* Scenario Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Add a scenario context?</Label>
              <Button
                onClick={() => setShowScenario(!showScenario)}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                {showScenario ? 'Hide' : 'Show'} Scenarios
              </Button>
            </div>

            {/* Scenario Selection */}
            {showScenario && (
              <div>
                <Label className="text-gray-300 mb-2 block">Select scenario (optional):</Label>
                <div className="grid grid-cols-2 gap-2">
                  {scenarios.map((s) => (
                    <button
                      key={s}
                      onClick={() => setScenario(scenario === s ? '' : s)}
                      className={`p-3 rounded-lg text-sm text-left transition-all ${
                        scenario === s
                          ? 'bg-purple-500/20 border border-purple-500'
                          : 'bg-[#121212] border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div>
              <Label className="text-gray-300 mb-2 block">Your thoughts:</Label>
              <Textarea
                placeholder={
                  role === 'employee'
                    ? 'e.g., I feel like my ideas aren\'t being heard in meetings...'
                    : 'e.g., I\'m struggling to get the team aligned on priorities...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                className="bg-[#121212] border-gray-700 text-white resize-none"
              />
            </div>

            <Button
              onClick={generateSuggestion}
              disabled={loading || !role || !input.trim()}
              className="w-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <MessageSquare className="h-5 w-5 mr-2 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Get AI Insight
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Insights History */}
        {insights.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Your Insights</h2>
            {insights.map((insight) => (
              <Card key={insight.id} className="bg-[#1e1e1e] border-gray-800 relative">
                <button
                  onClick={() => deleteInsight(insight.id)}
                  className="absolute top-3 right-3 p-1 rounded hover:bg-red-500/20 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
                </button>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    {insight.role === 'employee' ? (
                      <Users className="h-5 w-5 text-blue-400" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                    )}
                    {insight.role === 'employee' ? 'Team Member' : 'Leader'} Perspective
                  </CardTitle>
                  {insight.scenario && (
                    <CardDescription className="text-gray-400">Scenario: {insight.scenario}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-[#121212] rounded-lg border border-gray-800">
                    <p className="text-sm text-gray-400 mb-1">Your input:</p>
                    <p className="text-gray-300">{insight.input}</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-purple-400" />
                      <p className="text-sm font-semibold text-purple-300">AI Suggestion:</p>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{insight.ai_suggestion}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
