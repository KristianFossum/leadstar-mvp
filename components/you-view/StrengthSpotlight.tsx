import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Lightbulb } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface StrengthSpotlightProps {
  pillarId: string;
}

const pillarStrengths: Record<string, { default: string; tip: string }> = {
  mindset: {
    default: 'Your self-awareness shines here!',
    tip: 'Feed journal for deeper insights!'
  },
  values: {
    default: 'Your empathy is a team glue.',
    tip: 'Add a value to reflect it.'
  },
  goals: {
    default: 'Your vision drives you forward!',
    tip: 'Break this into micro-tasks.'
  },
  schedule: {
    default: 'Your discipline is your rhythm.',
    tip: 'Add a recurring reflection.'
  },
  growth: {
    default: 'You\'re leveling fast!',
    tip: '3 more tasks → badge.'
  },
  energy: {
    default: 'Your energy fuels greatness!',
    tip: 'Try a walk to recharge.'
  },
  impact: {
    default: 'Your wins are stacking.',
    tip: 'Log one to see the trend!'
  },
  vibe: {
    default: 'Your style is uniquely you!',
    tip: 'Try a new palette for a boost?'
  }
};

export function StrengthSpotlight({ pillarId }: StrengthSpotlightProps) {
  const { user } = useAuth();
  const [personalizedMessage, setPersonalizedMessage] = useState<string>('');
  const [tip, setTip] = useState<string>('');

  useEffect(() => {
    loadPersonalizedStrength();
  }, [pillarId, user]);

  const loadPersonalizedStrength = async () => {
    if (!user) {
      setPersonalizedMessage(pillarStrengths[pillarId]?.default || '');
      setTip(pillarStrengths[pillarId]?.tip || '');
      return;
    }

    try {
      // Get user template
      const { data: settings } = await supabase
        .from('user_settings')
        .select('template')
        .eq('user_id', user.id)
        .single();

      const template = settings?.template || 'Starter';

      // Get personality data for personalization
      const { data: personalityData } = await supabase
        .from('personality_results')
        .select('trait_scores')
        .eq('user_id', user.id)
        .order('update_date', { ascending: false })
        .limit(1)
        .single();

      // Get recent journal mood for energy pillar
      const { data: recentJournal } = await supabase
        .from('journal_entries')
        .select('mood')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      let message = pillarStrengths[pillarId]?.default || '';
      let personalizedTip = pillarStrengths[pillarId]?.tip || '';

      // Template-specific base messages
      if (template === 'Starter') {
        switch (pillarId) {
          case 'mindset':
            message = 'Your curiosity is your superpower!';
            personalizedTip = 'Feed your journal daily to unlock deeper insights';
            break;
          case 'goals':
            message = 'Small wins add up fast!';
            personalizedTip = 'Break big goals into micro-tasks';
            break;
          case 'impact':
            message = 'Your Daily Wins are stacking!';
            personalizedTip = 'Log one win to see the trend';
            break;
        }
      } else if (template === 'Manager') {
        switch (pillarId) {
          case 'values':
            message = 'Your empathy makes you team glue!';
            personalizedTip = 'Add a value that reflects your leadership style';
            break;
          case 'schedule':
            message = 'Your discipline creates team rhythm!';
            personalizedTip = 'Block time for 1-on-1s this week';
            break;
          case 'impact':
            message = 'Your Team Impact wins are stacking!';
            personalizedTip = 'Log team wins to see communication trends';
            break;
        }
      } else if (template === 'Entrepreneur') {
        switch (pillarId) {
          case 'goals':
            message = 'Your vision is bold — stay focused!';
            personalizedTip = 'Break big goals into weekly milestones';
            break;
          case 'impact':
            message = 'Innovation is your edge!';
            personalizedTip = 'Track KPIs: revenue, users, growth rate';
            break;
          case 'growth':
            message = 'You are scaling fast — remember rest!';
            personalizedTip = 'Schedule recovery time in your calendar';
            break;
        }
      }

      // Personalize based on personality traits
      if (personalityData?.trait_scores) {
        const traits = personalityData.trait_scores;

        switch (pillarId) {
          case 'mindset':
            if (traits.openness > 0.6) {
              message = 'High openness = creative genius.';
              personalizedTip = 'Feed journal for deeper insights!';
            } else if (traits.neuroticism < 0.4) {
              message = 'Your emotional stability shines here!';
              personalizedTip = 'Use your calm to mentor others.';
            }
            break;

          case 'values':
            if (traits.agreeableness > 0.6) {
              message = 'Your empathy = team glue.';
              personalizedTip = 'Add a value to reflect it.';
            }
            break;

          case 'goals':
            if (traits.conscientiousness > 0.6) {
              message = 'Conscientiousness = planning pro.';
              personalizedTip = 'Break this into micro-tasks.';
            }
            break;

          case 'schedule':
            if (traits.conscientiousness > 0.6) {
              message = 'Discipline = your rhythm.';
              personalizedTip = 'Add a recurring reflection.';
            } else if (traits.openness > 0.6) {
              message = 'Flexibility = your scheduling strength.';
              personalizedTip = 'Leave space for spontaneity.';
            }
            break;

          case 'growth':
            message = 'You\'re leveling fast!';
            personalizedTip = '3 more tasks → badge.';
            break;

          case 'energy':
            // Check journal mood first
            if (recentJournal?.mood && recentJournal.mood < 3) {
              message = 'Low mood? Your resilience will carry you.';
              personalizedTip = 'Try a walk.';
            } else if (traits.extraversion > 0.6) {
              message = 'Connection energizes you!';
              personalizedTip = 'Schedule social time intentionally.';
            } else if (traits.extraversion < 0.4) {
              message = 'Solo time = your recharge.';
              personalizedTip = 'Protect quiet reflection time.';
            }
            break;

          case 'impact':
            message = 'Your wins are stacking.';
            personalizedTip = 'Log one to see the trend!';
            break;

          case 'vibe':
            if (traits.openness > 0.6) {
              message = 'Your creativity fits Motivate palette.';
              personalizedTip = 'Try it for a boost?';
            } else {
              message = 'Calm palette fits your zen.';
              personalizedTip = 'Try Motivate for energy?';
            }
            break;
        }
      }

      setPersonalizedMessage(message);
      setTip(personalizedTip);
    } catch (error) {
      console.error('Error loading personalized strength:', error);
      setPersonalizedMessage(pillarStrengths[pillarId]?.default || '');
      setTip(pillarStrengths[pillarId]?.tip || '');
    }
  };

  return (
    <Card
      className="border-2 mb-4 animate-in fade-in duration-500"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--color-accent)'
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg" style={{ background: 'var(--color-accent)' }}>
            <Lightbulb className="h-5 w-5" style={{ color: '#ffffff' }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              💡 Your Superpower
            </h3>
            <p className="text-sm mb-2" style={{ color: 'var(--color-accent)' }}>
              {personalizedMessage} 🌟
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Try {tip}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
