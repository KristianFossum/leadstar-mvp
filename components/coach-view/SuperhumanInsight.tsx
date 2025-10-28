import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Calendar, Zap } from 'lucide-react';
import type { CoachInsight } from '@/hooks/useCoachData';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SuperhumanInsightProps {
  insight: CoachInsight | null;
  loading: boolean;
  onRefresh: () => void;
}

export function SuperhumanInsight({ insight, loading, onRefresh }: SuperhumanInsightProps) {
  const { user } = useAuth();

  const addMissionToCalendar = async () => {
    if (!insight || !user) return;

    try {
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      const { error } = await supabase.from('tasks').insert([
        {
          user_id: user.id,
          title: insight.mission,
          description: `Complete this to earn ${insight.mission_xp} XP`,
          task_date: today.toISOString(),
          repeat_type: 'none',
          repeat_interval: 0,
          reminder: true,
          completed: false,
        },
      ]);

      if (error) {
        console.error('Error adding mission to calendar:', error);
        throw error;
      }

      // Award XP to gamification
      const { data: gamData } = await supabase
        .from('gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (gamData) {
        await supabase
          .from('gamification')
          .update({ total_xp: gamData.total_xp + insight.mission_xp })
          .eq('user_id', user.id);
      }

      toast.success(`Mission added! +${insight.mission_xp} XP`, {
        style: {
          background: 'var(--accent-color, #4ecdc4)',
          color: '#fff'
        }
      });
    } catch (error: any) {
      console.error('Failed to add mission:', error);
      toast.error('Failed to add mission to calendar');
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#1e1e1e] border-gray-800 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          <div className="h-32 bg-gray-800 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!insight) {
    return (
      <Card className="bg-[#1e1e1e] border-gray-800 p-8 text-center">
        <p className="text-gray-400 mb-4">No insights available yet</p>
        <Button onClick={onRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate Insight
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] border-purple-500/30 p-8 relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">
              Today's Superhuman Insight
            </h2>
            <p className="text-gray-400 text-sm">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Button
            onClick={onRefresh}
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Main Insight */}
        <div className="bg-[#121212] rounded-lg p-6 mb-6 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <Zap className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
            <p className="text-lg text-white leading-relaxed">{insight.insight}</p>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Superhuman Progress Today</span>
            <span className="text-xl font-bold text-purple-400">
              {insight.superhuman_progress}%
            </span>
          </div>
          <Progress value={insight.superhuman_progress} className="h-3 bg-gray-800" />
          <p className="text-xs text-gray-500 mt-1">
            {100 - insight.superhuman_progress}% to superhuman today
          </p>
        </div>

        {/* Micro Mission */}
        <div className="bg-blue-500/10 rounded-lg p-6 border border-blue-500/30">
          <h3 className="text-sm font-semibold text-blue-400 mb-2 uppercase tracking-wide">
            Today's Micro-Mission
          </h3>
          <p className="text-white mb-4 text-lg">{insight.mission}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={addMissionToCalendar}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Calendar className="h-4 w-4" />
              Add to Calendar
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#121212] rounded-lg">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">
                +{insight.mission_xp} XP
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
