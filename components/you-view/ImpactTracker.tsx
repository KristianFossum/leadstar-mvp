import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Trophy } from 'lucide-react';
import type { EnhancedJournalEntry, PersonalGoal } from '../../types/you-view';

interface ImpactTrackerProps {
  journalEntries: EnhancedJournalEntry[];
  goals: PersonalGoal[];
  tasks?: any[]; // From calendar
}

export function ImpactTracker({ journalEntries, goals, tasks = [] }: ImpactTrackerProps) {
  // Calculate wins over time (last 4 weeks)
  const winsData = useMemo(() => {
    const weeks = [];
    const today = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekEntries = journalEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      const totalWins = weekEntries.reduce((sum, entry) => sum + entry.wins.length, 0);
      const completedTasks = tasks.filter((task) => {
        const taskDate = new Date(task.date);
        return task.completed && taskDate >= weekStart && taskDate <= weekEnd;
      }).length;

      weeks.push({
        week: `Week ${4 - i}`,
        wins: totalWins,
        tasks: completedTasks,
        total: totalWins + completedTasks,
      });
    }

    return weeks;
  }, [journalEntries, tasks]);

  // Get top win this week
  const topWin = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const thisWeekEntries = journalEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= weekStart;
    });

    const allWins = thisWeekEntries.flatMap((entry) => entry.wins);

    if (allWins.length === 0) return null;

    // Return the longest win (most detailed)
    return allWins.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );
  }, [journalEntries]);

  // Goal completion stats
  const goalStats = useMemo(() => {
    const completed = goals.filter((g) => g.status === 'completed').length;
    const inProgress = goals.filter((g) => g.status === 'in-progress').length;
    const notStarted = goals.filter((g) => g.status === 'not-started').length;
    const avgProgress = goals.length > 0
      ? (goals.reduce((sum, g) => sum + g.progress, 0) / goals.length).toFixed(0)
      : 0;

    return { completed, inProgress, notStarted, avgProgress, total: goals.length };
  }, [goals]);

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className="p-4 border-0"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            This Week's Wins
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--color-primary)' }}>
            {winsData[3]?.wins || 0}
          </div>
        </Card>

        <Card
          className="p-4 border-0"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Tasks Done
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--color-accent)' }}>
            {winsData[3]?.tasks || 0}
          </div>
        </Card>

        <Card
          className="p-4 border-0"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Goals Progress
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--color-secondary)' }}>
            {goalStats.avgProgress}%
          </div>
        </Card>

        <Card
          className="p-4 border-0"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Goals Completed
          </div>
          <div className="text-3xl font-bold mt-2" style={{ color: 'var(--color-primary)' }}>
            {goalStats.completed}/{goalStats.total}
          </div>
        </Card>
      </div>

      {/* Wins & Tasks Chart */}
      <Card
        className="p-4 border-0"
        style={{ background: 'var(--bg-primary)' }}
      >
        <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
          Wins & Tasks (Last 4 Weeks)
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={winsData}>
            <XAxis
              dataKey="week"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              stroke="var(--text-secondary)"
            />
            <YAxis
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
            <Bar dataKey="wins" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="tasks" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: 'var(--color-primary)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Wins</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: 'var(--color-accent)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Tasks</span>
          </div>
        </div>
      </Card>

      {/* Top Win This Week */}
      {topWin && (
        <Card
          className="p-6 border-0"
          style={{
            background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
          }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Trophy className="h-12 w-12 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold mb-2 text-white flex items-center gap-2">
                Top Win This Week
                <Badge className="bg-white/20 text-white border-0">🏆</Badge>
              </h4>
              <p className="text-white/90 text-lg">{topWin}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Goal Breakdown */}
      <Card
        className="p-4 border-0"
        style={{ background: 'var(--bg-primary)' }}
      >
        <h4 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
          Goal Status Breakdown
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completed</span>
            <div className="flex items-center gap-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${goalStats.total > 0 ? (goalStats.completed / goalStats.total) * 100 : 0}%`,
                  minWidth: '20px',
                  background: 'var(--color-primary)',
                }}
              />
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {goalStats.completed}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>In Progress</span>
            <div className="flex items-center gap-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${goalStats.total > 0 ? (goalStats.inProgress / goalStats.total) * 100 : 0}%`,
                  minWidth: '20px',
                  background: 'var(--color-accent)',
                }}
              />
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {goalStats.inProgress}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Not Started</span>
            <div className="flex items-center gap-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${goalStats.total > 0 ? (goalStats.notStarted / goalStats.total) * 100 : 0}%`,
                  minWidth: '20px',
                  background: 'var(--color-secondary)',
                }}
              />
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {goalStats.notStarted}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
