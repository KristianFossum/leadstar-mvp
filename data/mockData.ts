import type { UserProfile, JournalEntry, KPI, RecurringTask } from '../types/dashboard';

export const mockUserProfile: UserProfile = {
  id: '1',
  name: 'Alex Johnson',
  role: 'Engineering Team Lead',
  values: ['Transparency', 'Innovation', 'Empathy', 'Growth Mindset'],
  personality: 'ENTJ - The Commander',
};

export const mockJournalEntries: JournalEntry[] = [
  {
    id: '1',
    date: new Date(),
    wins: ['Shipped new feature ahead of schedule', 'Mentored junior developer'],
    struggles: ['Time management with meetings', 'Balancing strategic vs tactical work'],
    mood: 'good',
  },
];

export const mockKPIs: KPI[] = [
  {
    id: '1',
    title: 'Team Velocity',
    value: 75,
    target: 100,
    unit: 'story points',
    color: '#3b82f6',
  },
  {
    id: '2',
    title: 'Code Review Response Time',
    value: 60,
    target: 100,
    unit: 'hours',
    color: '#10b981',
  },
  {
    id: '3',
    title: 'Team Satisfaction',
    value: 85,
    target: 100,
    unit: '%',
    color: '#f59e0b',
  },
];

export const mockRecurringTasks: RecurringTask[] = [
  {
    id: '1',
    title: 'Weekly 1-on-1s',
    description: 'Complete all team member check-ins',
    frequency: 'weekly',
    completed: false,
    lastReset: new Date(),
  },
  {
    id: '2',
    title: 'Sprint Planning',
    description: 'Prepare and lead sprint planning session',
    frequency: 'weekly',
    completed: false,
    lastReset: new Date(),
  },
  {
    id: '3',
    title: 'Team Retrospective',
    description: 'Facilitate team retro and document action items',
    frequency: 'weekly',
    completed: false,
    lastReset: new Date(),
  },
];
