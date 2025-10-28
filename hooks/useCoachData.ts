import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { generateCoachInsight } from '@/lib/ai/coach-ai';

export interface CoachInsight {
  id: string;
  date: string;
  insight: string;
  mission: string;
  mission_xp: number;
  scenario_json: any;
  superhuman_progress: number;
  history_json: any[];
}

export function useCoachData(userId?: string) {
  const [insight, setInsight] = useState<CoachInsight | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodayInsight = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Check if we have today's insight
      const { data: existingInsight, error } = await supabase
        .from('coach_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existingInsight && !error) {
        setInsight(existingInsight);
      } else {
        // Generate new insight
        const newInsight = await generateCoachInsight(userId);

        if (newInsight) {
          const { data, error: insertError } = await supabase
            .from('coach_insights')
            .insert([newInsight])
            .select()
            .single();

          if (data && !insertError) {
            setInsight(data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching coach insight:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayInsight();
  }, [userId]);

  const refreshInsight = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Delete today's insight to force regeneration
      await supabase
        .from('coach_insights')
        .delete()
        .eq('user_id', userId)
        .eq('date', today);

      // Generate fresh insight
      await fetchTodayInsight();
    } catch (error) {
      console.error('Error refreshing insight:', error);
    }
  };

  return { insight, loading, refreshInsight };
}
