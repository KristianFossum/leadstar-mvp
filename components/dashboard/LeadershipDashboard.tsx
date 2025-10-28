import { useState } from 'react';
import { UserProfileCard } from './UserProfileCard';
import { DailyJournal } from './DailyJournal';
import { KPITracker } from './KPITracker';
import { FeedbackForm } from './FeedbackForm';
import { GrokChatPanel } from './GrokChatPanel';
import { RecurringTasks } from './RecurringTasks';
import { mockUserProfile, mockJournalEntries, mockKPIs, mockRecurringTasks } from '../../data/mockData';
import type { JournalEntry, Feedback, RecurringTask } from '../../types/dashboard';
import { Toaster } from '../ui/sonner';

export function LeadershipDashboard() {
  const [journalEntries, setJournalEntries] = useState(mockJournalEntries);
  const [recurringTasks, setRecurringTasks] = useState(mockRecurringTasks);

  const handleAddJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setJournalEntries([newEntry, ...journalEntries]);
  };

  const handleSubmitFeedback = (feedback: Omit<Feedback, 'id' | 'timestamp'>) => {
    console.log('Feedback submitted:', feedback);
  };

  const handleToggleTask = (taskId: string) => {
    setRecurringTasks((tasks) =>
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleResetWeeklyTasks = () => {
    setRecurringTasks((tasks) =>
      tasks.map((task) =>
        task.frequency === 'weekly'
          ? { ...task, completed: false, lastReset: new Date() }
          : task
      )
    );
  };

  const grokWebhookUrl = import.meta.env.VITE_GROK_WEBHOOK_URL;

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Leadership Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Track your growth, lead with intention
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <UserProfileCard profile={mockUserProfile} />
            </div>

            <div className="lg:col-span-2">
              <KPITracker kpis={mockKPIs} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DailyJournal entries={journalEntries} onAddEntry={handleAddJournalEntry} />

            <RecurringTasks
              tasks={recurringTasks}
              onToggleTask={handleToggleTask}
              onResetWeeklyTasks={handleResetWeeklyTasks}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FeedbackForm onSubmit={handleSubmitFeedback} />

            <GrokChatPanel webhookUrl={grokWebhookUrl} />
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
