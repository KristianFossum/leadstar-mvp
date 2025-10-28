export interface PersonalProfile {
  id: string;
  name: string;
  role: string;
  values: string[];
  personalityType: string;
  goals: string[];
  preferences: Record<string, any>;
  onboardingCompleted: boolean;
}

export interface PersonalityTestQuestion {
  id: string;
  question: string;
  options: {
    text: string;
    score: Record<string, number>;
  }[];
}

export interface PersonalityTestResult {
  id: string;
  userId: string;
  testDate: Date;
  scores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  strengths: string[];
  weaknesses: string[];
  leadershipTips: string[];
}

export interface EnhancedJournalEntry {
  id: string;
  date: Date;
  wins: string[];
  struggles: string[];
  mood: 'excellent' | 'good' | 'neutral' | 'challenging' | 'difficult';
  moodEmoji: string;
  reflections: string;
  linkedGoals?: string[];
  linkedKPIs?: string[];
  autoSaved: boolean;
  lastSaved?: Date;
}

export interface AIInsight {
  id: string;
  userId: string;
  date: Date;
  empatheticComment: string;
  actionTip: string;
  goalConnection: string;
  basedOn: {
    journalEntries?: string[];
    personality?: string;
    kpis?: string[];
  };
}

export interface PersonalGoal {
  id: string;
  title: string;
  description: string;
  type: 'personal' | 'professional' | 'health' | 'leadership';
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  progress: number;
  targetDate: Date;
  createdDate: Date;
  linkedJournalEntries?: string[];
  linkedTasks?: string[];
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold';
}

export interface CoachingPlan {
  id: string;
  userId: string;
  title: string;
  description: string;
  basedOnPersonality: string;
  tips: CoachingTip[];
  resources: Resource[];
  dailyReminders: string[];
  createdDate: Date;
  lastUpdated: Date;
}

export interface CoachingTip {
  id: string;
  title: string;
  description: string;
  category: 'communication' | 'leadership' | 'productivity' | 'wellbeing' | 'growth';
  priority: 'high' | 'medium' | 'low';
}

export interface Resource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'book' | 'course' | 'podcast';
  url: string;
  description: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  task_date: string;
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  repeat_interval: number;
  repeat_end_date: string | null;
  reminder: boolean;
  completed: boolean;
  emoji: string;
  linked_journal_id: string | null;
  linked_goal_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface DashboardSection {
  id: string;
  type: 'profile' | 'personality' | 'personality-analyzer' | 'journal' | 'journal-analyzer' | 'insights' | 'goals' | 'coaching' | 'chat' | 'calendar';
  title: string;
  order: number;
  visible: boolean;
  collapsed: boolean;
}
