export interface UserProfile {
  id: string;
  name: string;
  role: string;
  values: string[];
  personality: string;
  avatar?: string;
}

export interface JournalEntry {
  id: string;
  date: Date;
  wins: string[];
  struggles: string[];
  mood: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
}

export interface KPI {
  id: string;
  title: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}

export interface Feedback {
  id: string;
  content: string;
  category: string;
  timestamp: Date;
  anonymous: boolean;
}

export interface RecurringTask {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  completed: boolean;
  lastReset: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
