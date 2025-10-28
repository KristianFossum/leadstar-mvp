import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { generateCoachInsight } from '@/lib/ai/coach-ai';
import {
  Target,
  Zap,
  TrendingUp,
  Star,
  Trophy,
  Calendar,
  Flame,
  Brain,
  Heart,
  Sparkles,
} from 'lucide-react';

interface DashboardData {
  insight: string;
  mission: string;
  missionXp: number;
  xp: number;
  level: number;
  streak: number;
  goals: any[];
  strengths: Array<{ pillar: string; message: string; tip: string }>;
  nextAction: string;
  wins: string[];
  kpis: any[];
  template: 'Starter' | 'Manager' | 'Entrepreneur';
}

export default function LeadStar() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get or generate coach insight
      const today = new Date().toISOString().split('T')[0];
      let { data: coachInsight } = await supabase
        .from('coach_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (!coachInsight) {
        const insight = await generateCoachInsight(user.id);
        const { data: newInsight } = await supabase
          .from('coach_insights')
          .upsert(insight)
          .select()
          .single();
        coachInsight = newInsight;
      }

      // Get user settings (for template)
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const template = settings?.template || 'Starter';

      // Get gamification
      const { data: gamification } = await supabase
        .from('gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Get goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .limit(3);

      // Get recent journal wins
      const { data: journals } = await supabase
        .from('journal_entries')
        .select('wins')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(3);

      const allWins = journals?.flatMap((j) => j.wins || []).slice(0, 5) || [];

      // Get personality for strengths
      const { data: personality } = await supabase
        .from('personality_results')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Generate strength spotlights based on template
      const strengths = generateStrengths(personality, template);

      // Get KPIs (placeholder)
      const kpis = [
        { label: 'Tasks Done', value: gamification?.total_xp || 0, trend: '+12%' },
        { label: 'Streak Days', value: gamification?.streak_count || 0, trend: '+5%' },
        { label: 'Goals Active', value: goals?.length || 0, trend: '→' },
      ];

      setData({
        insight: coachInsight?.insight || 'Your journey starts today!',
        mission: coachInsight?.mission || 'Set your first goal',
        missionXp: coachInsight?.mission_xp || 50,
        xp: gamification?.total_xp || 0,
        level: gamification?.current_level || 1,
        streak: gamification?.streak_count || 0,
        goals: goals || [],
        strengths,
        nextAction: 'Check your Goals pillar to set a new target',
        wins: allWins,
        kpis,
        template,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStrengths = (personality: any, template: string) => {
    const strengths = [];

    if (template === 'Starter') {
      strengths.push({
        pillar: 'Mindset',
        message: 'Your curiosity is your superpower! 🌱',
        tip: 'Feed your journal daily to unlock deeper insights',
      });
      strengths.push({
        pillar: 'Growth',
        message: 'You are building momentum — keep going! 🚀',
        tip: '3 more tasks to unlock your next badge',
      });
      strengths.push({
        pillar: 'Energy',
        message: 'Small wins add up fast! ⚡',
        tip: 'Track your mood to spot patterns',
      });
    } else if (template === 'Manager') {
      strengths.push({
        pillar: 'Values',
        message: 'Your empathy makes you a team glue! 🌟',
        tip: 'Add a value that reflects your leadership style',
      });
      strengths.push({
        pillar: 'Impact',
        message: 'Your communication wins are stacking! 📈',
        tip: 'Log team wins to see trends',
      });
      strengths.push({
        pillar: 'Schedule',
        message: 'Your discipline creates team rhythm! 📅',
        tip: 'Block time for 1-on-1s this week',
      });
    } else {
      // Entrepreneur
      strengths.push({
        pillar: 'Goals',
        message: 'Your vision is bold — stay focused! 🎯',
        tip: 'Break big goals into weekly milestones',
      });
      strengths.push({
        pillar: 'Impact',
        message: 'Innovation is your edge! 📈',
        tip: 'Track KPIs: revenue, users, growth rate',
      });
      strengths.push({
        pillar: 'Growth',
        message: 'You are scaling fast — do not forget rest! 🚀',
        tip: 'Schedule recovery time in your calendar',
      });
    }

    return strengths;
  };

  const handleMissionClick = async () => {
    if (!user || !data) return;

    // Add mission as task
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('tasks').insert([
      {
        user_id: user.id,
        title: data.mission,
        desc: 'Daily mission from AI Coach',
        date: today,
        repeat_type: 'none',
        repeat_interval: 0,
        reminder: true,
        completed: false,
      },
    ]);

    alert('Mission added to your Schedule! 🎯');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="animate-pulse space-y-4 w-full max-w-6xl px-4">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-48 bg-gray-800 rounded"></div>
            <div className="h-48 bg-gray-800 rounded"></div>
            <div className="h-48 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Your Life OS
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {data.template} Mode • Level {data.level} • {data.xp} XP
          </p>
        </div>

        {/* Today Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Superhuman Insight */}
          <Card className="bg-[#1e1e1e] border-purple-500/30 p-6 lg:col-span-2">
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-purple-400" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-2">Today's Superhuman Insight</h2>
                <p className="text-gray-300 text-lg mb-4">{data.insight}</p>

                {/* Micro-mission */}
                <div className="bg-[#121212] border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-purple-400 font-semibold">MICRO-MISSION</span>
                    <span className="text-yellow-400 text-sm">+{data.missionXp} XP</span>
                  </div>
                  <p className="text-white mb-3">{data.mission}</p>
                  <button
                    onClick={handleMissionClick}
                    className="w-full py-2 rounded-lg font-semibold transition-all hover:scale-105"
                    style={{ backgroundColor: colors.accent }}
                  >
                    Add to Calendar
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-[#1e1e1e] border-gray-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Level</span>
                <span className="text-2xl font-bold text-white">{data.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  Streak
                </span>
                <span className="text-2xl font-bold text-orange-400">{data.streak}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total XP</span>
                <span className="text-2xl font-bold text-yellow-400">{data.xp}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress & Strengths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Progress */}
          <Card className="bg-[#1e1e1e] border-gray-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-400" />
              Active Goals
            </h3>
            <div className="space-y-4">
              {data.goals.length > 0 ? (
                data.goals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{goal.title}</span>
                      <span className="text-blue-400">
                        {goal.current_value}/{goal.target_value}
                      </span>
                    </div>
                    <div className="h-2 bg-[#121212] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(goal.current_value / goal.target_value) * 100}%`,
                          backgroundColor: colors.accent,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No active goals. Set one in YOU!</p>
              )}
            </div>
          </Card>

          {/* KPI Trends */}
          <Card className="bg-[#1e1e1e] border-gray-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              KPI Trends
            </h3>
            <div className="space-y-4">
              {data.kpis.map((kpi, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{kpi.label}</p>
                    <p className="text-2xl font-bold text-white">{kpi.value}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      kpi.trend.startsWith('+') ? 'text-green-400' : 'text-gray-400'
                    }`}
                  >
                    {kpi.trend}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Strength Spotlights */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Your Superpowers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.strengths.map((strength, idx) => (
              <Card
                key={idx}
                className="bg-[#1e1e1e] border-l-4 p-4"
                style={{ borderLeftColor: colors.accent }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <Brain className="h-5 w-5" style={{ color: colors.accent }} />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">{strength.pillar}</p>
                    <p className="text-white font-semibold mb-1">{strength.message}</p>
                    <p className="text-sm text-gray-400">{strength.tip}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Wins */}
        <Card className="bg-[#1e1e1e] border-gray-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Recent Wins
          </h3>
          <div className="space-y-2">
            {data.wins.length > 0 ? (
              data.wins.map((win, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-[#121212] rounded-lg">
                  <Heart className="h-5 w-5 text-pink-400 mt-0.5" />
                  <p className="text-gray-300">{win}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No wins yet. Log your first in Journal!</p>
            )}
          </div>
        </Card>

        {/* Next Action */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">NEXT RECOMMENDED ACTION</p>
          <p className="text-lg text-white">{data.nextAction}</p>
        </div>
      </div>
    </div>
  );
}
