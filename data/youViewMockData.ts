import type {
  PersonalProfile,
  PersonalityTestQuestion,
  PersonalityTestResult,
  EnhancedJournalEntry,
  AIInsight,
  PersonalGoal,
  CoachingPlan,
  DashboardSection
} from '../types/you-view';

export const mockPersonalProfile: PersonalProfile = {
  id: '1',
  name: 'Alex Johnson',
  role: 'Engineering Team Lead',
  values: ['Transparency', 'Innovation', 'Empathy', 'Growth Mindset'],
  personalityType: 'ENTJ - The Commander',
  goals: [],
  preferences: {
    theme: 'light',
    notifications: true,
  },
  onboardingCompleted: false,
};

export const personalityTestQuestions: PersonalityTestQuestion[] = [
  {
    id: '1',
    question: 'I enjoy exploring new ideas and concepts.',
    options: [
      { text: 'Strongly Disagree', score: { openness: 1 } },
      { text: 'Disagree', score: { openness: 2 } },
      { text: 'Neutral', score: { openness: 3 } },
      { text: 'Agree', score: { openness: 4 } },
      { text: 'Strongly Agree', score: { openness: 5 } },
    ],
  },
  {
    id: '2',
    question: 'I am very organized and like to plan things in advance.',
    options: [
      { text: 'Strongly Disagree', score: { conscientiousness: 1 } },
      { text: 'Disagree', score: { conscientiousness: 2 } },
      { text: 'Neutral', score: { conscientiousness: 3 } },
      { text: 'Agree', score: { conscientiousness: 4 } },
      { text: 'Strongly Agree', score: { conscientiousness: 5 } },
    ],
  },
  {
    id: '3',
    question: 'I feel energized when I am around other people.',
    options: [
      { text: 'Strongly Disagree', score: { extraversion: 1 } },
      { text: 'Disagree', score: { extraversion: 2 } },
      { text: 'Neutral', score: { extraversion: 3 } },
      { text: 'Agree', score: { extraversion: 4 } },
      { text: 'Strongly Agree', score: { extraversion: 5 } },
    ],
  },
  {
    id: '4',
    question: 'I am compassionate and caring towards others.',
    options: [
      { text: 'Strongly Disagree', score: { agreeableness: 1 } },
      { text: 'Disagree', score: { agreeableness: 2 } },
      { text: 'Neutral', score: { agreeableness: 3 } },
      { text: 'Agree', score: { agreeableness: 4 } },
      { text: 'Strongly Agree', score: { agreeableness: 5 } },
    ],
  },
  {
    id: '5',
    question: 'I often worry about things that might go wrong.',
    options: [
      { text: 'Strongly Disagree', score: { neuroticism: 1 } },
      { text: 'Disagree', score: { neuroticism: 2 } },
      { text: 'Neutral', score: { neuroticism: 3 } },
      { text: 'Agree', score: { neuroticism: 4 } },
      { text: 'Strongly Agree', score: { neuroticism: 5 } },
    ],
  },
  {
    id: '6',
    question: 'I appreciate art, music, and creative expression.',
    options: [
      { text: 'Strongly Disagree', score: { openness: 1 } },
      { text: 'Disagree', score: { openness: 2 } },
      { text: 'Neutral', score: { openness: 3 } },
      { text: 'Agree', score: { openness: 4 } },
      { text: 'Strongly Agree', score: { openness: 5 } },
    ],
  },
  {
    id: '7',
    question: 'I am reliable and always follow through on my commitments.',
    options: [
      { text: 'Strongly Disagree', score: { conscientiousness: 1 } },
      { text: 'Disagree', score: { conscientiousness: 2 } },
      { text: 'Neutral', score: { conscientiousness: 3 } },
      { text: 'Agree', score: { conscientiousness: 4 } },
      { text: 'Strongly Agree', score: { conscientiousness: 5 } },
    ],
  },
  {
    id: '8',
    question: 'I prefer working in groups rather than alone.',
    options: [
      { text: 'Strongly Disagree', score: { extraversion: 1 } },
      { text: 'Disagree', score: { extraversion: 2 } },
      { text: 'Neutral', score: { extraversion: 3 } },
      { text: 'Agree', score: { extraversion: 4 } },
      { text: 'Strongly Agree', score: { extraversion: 5 } },
    ],
  },
  {
    id: '9',
    question: 'I am patient and understanding when dealing with conflicts.',
    options: [
      { text: 'Strongly Disagree', score: { agreeableness: 1 } },
      { text: 'Disagree', score: { agreeableness: 2 } },
      { text: 'Neutral', score: { agreeableness: 3 } },
      { text: 'Agree', score: { agreeableness: 4 } },
      { text: 'Strongly Agree', score: { agreeableness: 5 } },
    ],
  },
  {
    id: '10',
    question: 'I remain calm under pressure and handle stress well.',
    options: [
      { text: 'Strongly Disagree', score: { neuroticism: 5 } },
      { text: 'Disagree', score: { neuroticism: 4 } },
      { text: 'Neutral', score: { neuroticism: 3 } },
      { text: 'Agree', score: { neuroticism: 2 } },
      { text: 'Strongly Agree', score: { neuroticism: 1 } },
    ],
  },
];

export const mockPersonalityTestResult: PersonalityTestResult = {
  id: '1',
  userId: '1',
  testDate: new Date(),
  scores: {
    openness: 4.2,
    conscientiousness: 4.5,
    extraversion: 3.8,
    agreeableness: 4.0,
    neuroticism: 2.5,
  },
  strengths: [
    'Highly organized and detail-oriented',
    'Creative problem solver',
    'Strong empathy and people skills',
    'Emotionally stable under pressure',
  ],
  weaknesses: [
    'May be too perfectionistic at times',
    'Could benefit from more spontaneity',
    'Might overcommit to helping others',
  ],
  leadershipTips: [
    'Leverage your organizational skills to create clear team processes',
    'Use your creativity to inspire innovative solutions',
    'Your empathy makes you great at one-on-ones - keep prioritizing them',
    'Balance your perfectionism by delegating and trusting your team',
  ],
};

export const mockEnhancedJournalEntries: EnhancedJournalEntry[] = [
  {
    id: '1',
    date: new Date(),
    wins: ['Shipped new feature ahead of schedule', 'Mentored junior developer'],
    struggles: ['Time management with meetings', 'Balancing strategic vs tactical work'],
    mood: 'good',
    moodEmoji: '😊',
    reflections: 'Today was productive overall. The mentoring session was particularly rewarding.',
    linkedGoals: ['goal-1'],
    linkedKPIs: ['kpi-1'],
    autoSaved: true,
    lastSaved: new Date(),
  },
];

export const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    userId: '1',
    date: new Date(),
    empatheticComment: "Great job shipping that feature ahead of schedule! Your strong conscientiousness is really showing through here.",
    actionTip: "Consider blocking 'deep work' time on your calendar to balance strategic thinking with tactical execution.",
    goalConnection: "This aligns perfectly with your goal to improve time management. Your mentor sessions are building toward your leadership development goal.",
    basedOn: {
      journalEntries: ['1'],
      personality: 'High conscientiousness, moderate extraversion',
      kpis: ['kpi-1'],
    },
  },
];

export const mockPersonalGoals: PersonalGoal[] = [
  {
    id: 'goal-1',
    title: 'Improve Time Management',
    description: 'Better balance between strategic thinking and tactical execution',
    type: 'professional',
    specific: 'Reduce meeting time by 20% and increase focus time',
    measurable: 'Track calendar time weekly',
    achievable: 'Decline non-essential meetings and block focus time',
    relevant: 'Critical for career growth as a team lead',
    timeBound: 'Achieve by end of Q2 2025',
    progress: 35,
    targetDate: new Date('2025-06-30'),
    createdDate: new Date('2025-01-01'),
    linkedJournalEntries: ['1'],
    linkedTasks: [],
    status: 'in-progress',
  },
  {
    id: 'goal-2',
    title: 'Develop Leadership Presence',
    description: 'Build confidence in presenting to senior leadership',
    type: 'leadership',
    specific: 'Present at 3 executive meetings this quarter',
    measurable: 'Track presentations and gather feedback',
    achievable: 'Volunteer for update presentations',
    relevant: 'Essential for promotion to senior leadership',
    timeBound: 'Complete by end of Q1 2025',
    progress: 67,
    targetDate: new Date('2025-03-31'),
    createdDate: new Date('2025-01-01'),
    status: 'in-progress',
  },
];

export const mockCoachingPlans: CoachingPlan[] = [
  {
    id: '1',
    userId: '1',
    title: 'Leadership Excellence for the Conscientious Commander',
    description: 'A personalized coaching plan based on your ENTJ personality and high conscientiousness',
    basedOnPersonality: 'ENTJ with high conscientiousness and moderate extraversion',
    tips: [
      {
        id: 'tip-1',
        title: 'Delegate with Confidence',
        description: 'Your perfectionism is a strength, but learn to trust your team with important tasks.',
        category: 'leadership',
        priority: 'high',
      },
      {
        id: 'tip-2',
        title: 'Schedule Strategic Thinking Time',
        description: 'Block 2 hours every week for big-picture planning without interruptions.',
        category: 'productivity',
        priority: 'high',
      },
      {
        id: 'tip-3',
        title: 'Practice Active Listening',
        description: 'In one-on-ones, focus on listening 70% and speaking 30%.',
        category: 'communication',
        priority: 'medium',
      },
      {
        id: 'tip-4',
        title: 'Celebrate Small Wins',
        description: 'Acknowledge team progress weekly to boost morale and motivation.',
        category: 'leadership',
        priority: 'medium',
      },
    ],
    resources: [
      {
        id: 'res-1',
        title: 'The Manager\'s Path by Camille Fournier',
        type: 'book',
        url: 'https://www.oreilly.com/library/view/the-managers-path/9781491973882/',
        description: 'Essential guide for tech leadership',
      },
      {
        id: 'res-2',
        title: 'How to Delegate Effectively',
        type: 'article',
        url: 'https://hbr.org/2017/10/to-be-a-great-leader-you-have-to-learn-how-to-delegate-well',
        description: 'HBR article on delegation strategies',
      },
      {
        id: 'res-3',
        title: 'Deep Work by Cal Newport',
        type: 'book',
        url: 'https://www.calnewport.com/books/deep-work/',
        description: 'Learn to focus in a distracted world',
      },
    ],
    dailyReminders: [
      'Start the day by reviewing your top 3 priorities',
      'Block focus time before checking email',
      'End each day by journaling one win and one learning',
      'Practice gratitude - acknowledge one team member daily',
    ],
    createdDate: new Date(),
    lastUpdated: new Date(),
  },
];

export const defaultDashboardSections: DashboardSection[] = [
  { id: 'profile', type: 'profile', title: 'Your Profile', order: 1, visible: true, collapsed: false },
  { id: 'insights', type: 'insights', title: 'AI Insights', order: 2, visible: true, collapsed: false },
  { id: 'journal', type: 'journal', title: 'Daily Journal', order: 3, visible: true, collapsed: false },
  { id: 'journal-analyzer', type: 'journal-analyzer', title: 'Journal Analyzer', order: 4, visible: true, collapsed: false },
  { id: 'personality-analyzer', type: 'personality-analyzer', title: 'Personality Analyzer', order: 5, visible: true, collapsed: false },
  { id: 'calendar', type: 'calendar', title: 'Calendar & Tasks', order: 6, visible: true, collapsed: false },
  { id: 'goals', type: 'goals', title: 'Personal Goals', order: 7, visible: true, collapsed: false },
  { id: 'coaching', type: 'coaching', title: 'Coaching Plan', order: 8, visible: true, collapsed: false },
  { id: 'chat', type: 'chat', title: 'AI Coach Chat', order: 9, visible: true, collapsed: false },
];
