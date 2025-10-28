import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { TrendingUp, AlertCircle } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface PillarScore {
  pillar: string;
  score: number;
  fullMark: number;
}

export function GrowthRadar() {
  const { user } = useAuth();
  const [radarData, setRadarData] = useState<PillarScore[]>([]);
  const [lowestPillar, setLowestPillar] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    calculateGrowthScores();
  }, [user]);

  const calculateGrowthScores = async () => {
    if (!user) return;

    try {
      // Fetch data from various tables
      const [journalData, tasksData, gamificationData, personalityData, goalsData] =
        await Promise.all([
          supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('tasks').select('*').eq('user_id', user.id),
          supabase.from('gamification').select('*').eq('user_id', user.id).single(),
          supabase.from('personality_results').select('*').eq('user_id', user.id).single(),
          supabase.from('journal_entries').select('linked_goals').eq('user_id', user.id),
        ]);

      // Calculate scores for each pillar (0-100)
      const mindsetScore = personalityData.data ? 80 : 50;
      const energyScore = journalData.data ? Math.min((journalData.data.length / 7) * 100, 100) : 30;
      const scheduleScore = tasksData.data
        ? Math.min(
            (tasksData.data.filter((t) => t.completed).length / Math.max(tasksData.data.length, 1)) * 100,
            100
          )
        : 40;
      const growthScore = gamificationData.data
        ? Math.min((gamificationData.data.total_xp / 1000) * 100, 100)
        : 25;
      const impactScore = goalsData.data
        ? Math.min((goalsData.data.filter((g: any) => g.linked_goals?.length > 0).length / 5) * 100, 100)
        : 35;

      const scores: PillarScore[] = [
        { pillar: 'Mindset', score: Math.round(mindsetScore), fullMark: 100 },
        { pillar: 'Energy', score: Math.round(energyScore), fullMark: 100 },
        { pillar: 'Schedule', score: Math.round(scheduleScore), fullMark: 100 },
        { pillar: 'Growth', score: Math.round(growthScore), fullMark: 100 },
        { pillar: 'Impact', score: Math.round(impactScore), fullMark: 100 },
      ];

      setRadarData(scores);

      // Find lowest pillar
      const lowest = scores.reduce((min, p) => (p.score < min.score ? p : min));
      setLowestPillar(lowest.pillar);

      // Generate suggestions based on lowest pillar
      const pillarSuggestions: Record<string, string[]> = {
        Mindset: [
          'Complete personality analyzer quiz',
          'Feed journal entries to AI coach',
          'Reflect on your leadership values',
        ],
        Energy: [
          'Journal daily for consistent mood tracking',
          'Take a 5-minute walk',
          'Schedule recovery time',
        ],
        Schedule: [
          'Complete pending tasks',
          'Add repeating habits to calendar',
          'Set reminders for key goals',
        ],
        Growth: [
          'Complete daily missions for XP',
          'Answer personality follow-up questions',
          'Track goal milestones',
        ],
        Impact: [
          'Link journal wins to specific goals',
          'Set measurable KPIs',
          'Celebrate completed milestones',
        ],
      };

      setSuggestions(pillarSuggestions[lowest.pillar] || []);
    } catch (error) {
      console.error('Error calculating growth scores:', error);
    }
  };

  return (
    <Card className="bg-[#1e1e1e] border-gray-800 p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-green-400" />
        <h3 className="text-xl font-bold text-white">Growth Radar</h3>
      </div>

      {/* Radar Chart */}
      <div className="flex-1 min-h-[250px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="pillar" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#374151" />
            <Radar
              name="Your Progress"
              dataKey="score"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      {lowestPillar && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-orange-400 mb-1">
                {lowestPillar} needs attention
              </h4>
              <p className="text-sm text-gray-300 mb-3">
                Here's how to boost your {lowestPillar} score:
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="text-sm text-gray-300 pl-4 before:content-['→'] before:mr-2 before:text-orange-400"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
