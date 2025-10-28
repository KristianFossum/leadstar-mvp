import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { EnhancedJournalEntry } from '../../types/you-view';

interface EnergyTrackerProps {
  journalEntries: EnhancedJournalEntry[];
}

const moodToScore: Record<string, number> = {
  '😊': 5,
  '👍': 4,
  '😐': 3,
  '😔': 2,
  '😤': 1,
};

export function EnergyTracker({ journalEntries }: EnergyTrackerProps) {
  const moodData = useMemo(() => {
    return journalEntries
      .slice(0, 14) // Last 14 days
      .reverse()
      .map((entry) => ({
        date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: moodToScore[entry.moodEmoji] || 3,
        emoji: entry.moodEmoji,
      }));
  }, [journalEntries]);

  const avgMood = useMemo(() => {
    if (moodData.length === 0) return '0.0';
    const sum = moodData.reduce((acc, curr) => acc + curr.mood, 0);
    return (sum / moodData.length).toFixed(1);
  }, [moodData]);

  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedEntries = [...journalEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === count) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }, [journalEntries]);

  // Generate heatmap for last 30 days
  const heatmapData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const entry = journalEntries.find((e) => {
        const entryDate = new Date(e.date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hasEntry: !!entry,
        mood: entry ? moodToScore[entry.moodEmoji] : 0,
        emoji: entry?.moodEmoji,
      });
    }

    return days;
  }, [journalEntries]);

  const getRecoveryTip = () => {
    const recentMood = parseFloat(avgMood);

    if (recentMood >= 4) {
      return "You're on fire! Keep that positive energy flowing. 🔥";
    } else if (recentMood >= 3) {
      return "Steady pace! Consider a 5-minute break to recharge. ☕";
    } else {
      return "Take care of yourself. Try a walk or talk to someone you trust. 💚";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-4 border-0"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Avg Mood (14d)
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--color-primary)' }}>
            {avgMood}/5.0
          </div>
        </Card>

        <Card
          className="p-4 border-0"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Current Streak
          </div>
          <div className="text-3xl font-bold mt-2 flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
            {streak} 🔥
          </div>
        </Card>

        <Card
          className="p-4 border-0"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Total Entries
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--color-secondary)' }}>
            {journalEntries.length}
          </div>
        </Card>
      </div>

      {/* Mood Trend Chart */}
      <Card
        className="p-4 border-0"
        style={{ background: 'var(--bg-primary)' }}
      >
        <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
          Mood Trend (Last 14 Days)
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={moodData}>
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              stroke="var(--text-secondary)"
            />
            <YAxis
              domain={[0, 5]}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              stroke="var(--text-secondary)"
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--color-accent)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
            />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="var(--color-primary)"
              strokeWidth={3}
              dot={{ fill: 'var(--color-accent)', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Streak Heatmap */}
      <Card
        className="p-4 border-0"
        style={{ background: 'var(--bg-primary)' }}
      >
        <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
          30-Day Streak Heatmap
        </h4>
        <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-30 gap-1">
          {heatmapData.map((day, idx) => (
            <div
              key={idx}
              className="aspect-square rounded flex items-center justify-center text-xs transition-all hover:scale-110 cursor-pointer"
              style={{
                background: day.hasEntry
                  ? `rgba(${day.mood === 5 ? '34, 197, 94' : day.mood === 4 ? '59, 130, 246' : day.mood === 3 ? '251, 191, 36' : day.mood === 2 ? '251, 146, 60' : '239, 68, 68'}, 0.7)`
                  : 'rgba(128, 128, 128, 0.2)',
              }}
              title={`${day.date}${day.hasEntry ? ` - ${day.emoji}` : ' - No entry'}`}
            >
              {day.emoji || ''}
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(128, 128, 128, 0.2)' }} />
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(239, 68, 68, 0.7)' }} />
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(251, 146, 60, 0.7)' }} />
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(251, 191, 36, 0.7)' }} />
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(59, 130, 246, 0.7)' }} />
            <div className="w-4 h-4 rounded" style={{ background: 'rgba(34, 197, 94, 0.7)' }} />
          </div>
          <span>More</span>
        </div>
      </Card>

      {/* Recovery Tip */}
      <Card
        className="p-4 border-0"
        style={{
          background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
        }}
      >
        <h4 className="text-sm font-semibold mb-2 text-white">Recovery Tip</h4>
        <p className="text-white/90">{getRecoveryTip()}</p>
      </Card>
    </div>
  );
}
