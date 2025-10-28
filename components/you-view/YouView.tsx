import { useState, useEffect } from 'react';
import { ProfileWizard } from './ProfileWizard';
import { PersonalityTest } from './PersonalityTest';
import { PersonalityAnalyzer } from './PersonalityAnalyzer';
import { JournalAnalyzer } from './JournalAnalyzer';
import { EnhancedJournal } from './EnhancedJournal';
import { AIInsightsCard } from './AIInsightsCard';
import { GoalTracker } from './GoalTracker';
import { CoachingPlanCard } from './CoachingPlanCard';
import { YouGrokChat } from './YouGrokChat';
import { CalendarScheduler } from './CalendarScheduler';
import { GamificationTile } from './GamificationTile';
import { ValuesEditor } from './ValuesEditor';
import { EnergyTracker } from './EnergyTracker';
import { ImpactTracker } from './ImpactTracker';
import { StrengthSpotlight } from './StrengthSpotlight';
import { TemplateWizard } from './TemplateWizard';
import ThemeSettings from '../ThemeSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Grid, Menu, X } from 'lucide-react';
import { Toaster } from '../ui/sonner';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { DashboardSection, PersonalProfile, PersonalityTestResult, EnhancedJournalEntry, PersonalGoal } from '../../types/you-view';
import {
  mockPersonalProfile,
  personalityTestQuestions,
  mockPersonalityTestResult,
  mockEnhancedJournalEntries,
  mockAIInsights,
  mockPersonalGoals,
  mockCoachingPlans,
  defaultDashboardSections,
} from '../../data/youViewMockData';
import { PillarReorder } from './PillarReorder';

interface LifePillarConfig {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

const getDefaultPillars = (template: string = 'Starter'): LifePillarConfig[] => {
  const basePillars = [
    { id: 'mindset', icon: '🧠', title: 'Mindset', subtitle: 'Personality & Self-Discovery' },
    { id: 'values', icon: '🌟', title: 'Values', subtitle: 'Core Beliefs & Leadership Style' },
    { id: 'goals', icon: '🎯', title: 'Goals', subtitle: 'SMART Goals & Milestones' },
    { id: 'schedule', icon: '📅', title: 'Schedule', subtitle: 'Calendar & Task Management' },
    { id: 'growth', icon: '🚀', title: 'Growth', subtitle: 'XP, Levels, Badges & Streaks' },
    { id: 'energy', icon: '🔥', title: 'Energy', subtitle: 'Mood Trends & Wellness' },
    { id: 'impact', icon: '📈', title: 'Impact', subtitle: 'KPIs & Wins Tracking' },
    { id: 'vibe', icon: '🎨', title: 'Vibe', subtitle: 'Theme & Personalization' },
  ];

  // Customize pillar names based on template
  if (template === 'Starter') {
    return basePillars.map((p) => {
      if (p.id === 'impact') return { ...p, title: 'Daily Wins', subtitle: 'Track Your Small Victories' };
      if (p.id === 'goals') return { ...p, subtitle: 'Small Steps & Habits' };
      return p;
    });
  } else if (template === 'Manager') {
    return basePillars.map((p) => {
      if (p.id === 'impact') return { ...p, title: 'Team Impact', subtitle: 'Communication & Influence' };
      if (p.id === 'schedule') return { ...p, subtitle: '1-on-1s & Team Rituals' };
      return p;
    });
  } else if (template === 'Entrepreneur') {
    return basePillars.map((p) => {
      if (p.id === 'impact') return { ...p, title: 'Vision Scale', subtitle: 'Revenue, Users, Growth' };
      if (p.id === 'goals') return { ...p, subtitle: 'Big Visions & Milestones' };
      return p;
    });
  }

  return basePillars;
};

const defaultPillars: LifePillarConfig[] = getDefaultPillars();

export function YouView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PersonalProfile>(mockPersonalProfile);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [personalityResult, setPersonalityResult] = useState<PersonalityTestResult | undefined>(mockPersonalityTestResult);
  const [journalEntries, setJournalEntries] = useState<EnhancedJournalEntry[]>(mockEnhancedJournalEntries);
  const [goals, setGoals] = useState<PersonalGoal[]>(mockPersonalGoals);
  const [selectedJournalForAnalysis, setSelectedJournalForAnalysis] = useState<EnhancedJournalEntry | undefined>();
  const [pillars, setPillars] = useState<LifePillarConfig[]>(defaultPillars);
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateWizard, setShowTemplateWizard] = useState(false);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      // Load user settings first to check onboarding status
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Check if onboarding is complete
      if (!settingsData || !settingsData.onboarding_complete || !settingsData.template) {
        setShowTemplateWizard(true);
        setIsLoading(false);
        return;
      }

      // Onboarding complete - load all data
      const [profileResult, personalityResult, journalResult, goalsResult] = await Promise.all([
        supabase.from('user_profile').select('*').eq('user_id', user.id).single(),
        supabase.from('personality_results').select('*').eq('user_id', user.id).order('update_date', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(10),
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      // Update profile state
      if (profileResult.data) {
        setProfile({
          id: profileResult.data.id,
          name: user.email?.split('@')[0] || 'User',
          role: profileResult.data.leadership_style || 'Leader',
          values: profileResult.data.values || [],
          personalityType: profileResult.data.leadership_style || '',
          goals: [],
          preferences: {},
          onboardingCompleted: true,
        });
      }

      // Update personality result
      if (personalityResult.data) {
        setPersonalityResult({
          id: personalityResult.data.id,
          userId: user.id,
          testDate: new Date(personalityResult.data.created_at),
          scores: {
            extraversion: personalityResult.data.extraversion || 3,
            conscientiousness: personalityResult.data.conscientiousness || 3,
            openness: personalityResult.data.openness || 3,
            agreeableness: personalityResult.data.agreeableness || 3,
            neuroticism: personalityResult.data.neuroticism || 3,
          },
          strengths: [],
          weaknesses: [],
          leadershipTips: [personalityResult.data.leadership_tip || ''],
        });
      }

      // Update journal entries
      if (journalResult.data) {
        setJournalEntries(journalResult.data.map((j: any) => ({
          id: j.id,
          date: new Date(j.date),
          wins: j.wins || [],
          struggles: j.struggles || [],
          mood: j.mood,
          moodEmoji: j.mood_emoji || '',
          reflections: j.reflections || '',
          linkedGoals: j.linked_goals || [],
          linkedKPIs: j.linked_kpis || [],
          autoSaved: j.auto_saved || false,
          lastSaved: j.last_saved ? new Date(j.last_saved) : undefined,
        })));
      }

      // Update goals
      if (goalsResult.data) {
        setGoals(goalsResult.data.map((g: any) => ({
          id: g.id,
          title: g.title,
          description: g.description || '',
          type: 'personal' as const,
          specific: g.title,
          measurable: '',
          achievable: '',
          relevant: '',
          timeBound: '',
          targetDate: new Date(g.created_at),
          progress: Number(g.progress) || 0,
          status: (Number(g.progress) === 100 ? 'completed' : Number(g.progress) > 0 ? 'in-progress' : 'not-started') as 'not-started' | 'in-progress' | 'completed' | 'on-hold',
          milestones: g.milestones || [],
          createdDate: new Date(g.created_at),
        })));
      }

      // Get template-based pillars
      const template = settingsData?.template || 'Starter';
      const templatePillars = getDefaultPillars(template);

      // Update pillar order
      if (settingsData && settingsData.pillar_order) {
        const loadedPillars = settingsData.pillar_order.map((id: string) => {
          return templatePillars.find((p) => p.id === id)!;
        }).filter(Boolean);
        setPillars(loadedPillars);
      } else {
        setPillars(templatePillars);
      }

      setShowOnboarding(false);
      setShowTemplateWizard(false);
    } catch (err) {
      console.error('Error loading user profile:', err);
      // On error, show template wizard to start fresh
      setShowTemplateWizard(true);
    } finally {
      setIsLoading(false);
    }
  };

  const savePillarOrder = async (reorderedPillars: LifePillarConfig[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          pillar_order: reorderedPillars.map((p) => p.id),
        });

      if (error) console.error('Error saving pillar order:', error);
    } catch (err) {
      console.error('Error saving pillar order:', err);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const handleCompleteOnboarding = async (updatedProfile: PersonalProfile, template?: string) => {
    if (!user) return;

    try {
      // Save profile to Supabase
      await supabase
        .from('user_profile')
        .upsert({
          user_id: user.id,
          values: updatedProfile.values,
          leadership_style: updatedProfile.role,
        });

      // Save template to user_settings with onboarding_complete flag
      if (template) {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            template: template,
            onboarding_complete: true,
          });
      }

      setProfile(updatedProfile);
      setShowOnboarding(false);

      // Show personalized welcome message based on template
      const templateMessages = {
        starter: 'Welcome! Your curiosity is super – build it with small wins! 🌱',
        manager: 'Welcome! Your team leadership journey starts now! 👔',
        entrepreneur: 'Welcome! Time to chase those big goals! 🚀',
      };

      toast.success(template ? (templateMessages as any)[template] : 'Welcome! Your profile is set up.');

      // Reload profile to ensure everything is in sync
      loadUserProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    setProfile({ ...profile, onboardingCompleted: true });
  };

  const handlePersonalityTestComplete = (result: PersonalityTestResult) => {
    setPersonalityResult(result);
    toast.success('Personality test completed!');
  };

  const handleAddJournalEntry = (entry: Omit<EnhancedJournalEntry, 'id'>) => {
    const newEntry: EnhancedJournalEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setJournalEntries([newEntry, ...journalEntries]);
    toast.success('Journal entry saved! 🌟');

    // Smart sync: Update related pillars
    setTimeout(() => {
      toast('Energy & Growth updated! 🔥', { duration: 2000 });
    }, 500);
  };

  const handleValuesChange = async (values: string[]) => {
    if (!user) return;

    try {
      await supabase
        .from('user_profile')
        .upsert({
          user_id: user.id,
          values: values,
        });

      setProfile({ ...profile, values });
      toast.success('Values updated!');
    } catch (error) {
      console.error('Error saving values:', error);
      toast.error('Failed to save values.');
    }
  };

  const handleAddGoal = (goal: Omit<PersonalGoal, 'id' | 'createdDate'>) => {
    const newGoal: PersonalGoal = {
      ...goal,
      id: Date.now().toString(),
      createdDate: new Date(),
    };
    setGoals([...goals, newGoal]);
    toast.success('Goal created!');
  };

  const handleUpdateProgress = (goalId: string, progress: number) => {
    setGoals(goals.map((g) => {
      if (g.id === goalId) {
        const newStatus = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started';
        return { ...g, progress, status: newStatus };
      }
      return g;
    }));
    toast.success('Progress updated!');
  };

  const handleFeedToAnalyzer = (entry: EnhancedJournalEntry) => {
    setSelectedJournalForAnalysis(entry);
    toast.success('Journal sent to analyzer! 🧠');
  };

  const handleTaskSuggestion = (task: { title: string; description: string }) => {
    toast.success('Task suggestion ready! Add it to your calendar.');
  };

  const handlePillarClick = (pillarId: string) => {
    setActivePillar(pillarId);
    setSidebarOpen(false);
  };

  const handleBackToOverview = () => {
    setActivePillar(null);
  };

  const handlePillarReorder = (reorderedPillars: LifePillarConfig[]) => {
    setPillars(reorderedPillars);
    savePillarOrder(reorderedPillars);
    toast.success('Pillar order updated!');
  };

  // Swipe navigation for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !activePillar) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      const currentIndex = pillars.findIndex(p => p.id === activePillar);

      if (diff > 0 && currentIndex < pillars.length - 1) {
        // Swipe left - next pillar
        setActivePillar(pillars[currentIndex + 1].id);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous pillar
        setActivePillar(pillars[currentIndex - 1].id);
      }
    }

    setTouchStart(null);
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center dark" style={{ background: 'var(--bg-primary)' }}>
        <ProfileWizard profile={profile} onComplete={handleCompleteOnboarding} onSkip={handleSkipOnboarding} />
        <Toaster />
      </div>
    );
  }

  if (showTemplateWizard) {
    return (
      <>
        <TemplateWizard onComplete={() => {
          setShowTemplateWizard(false);
          loadUserProfile();
        }} />
        <Toaster />
      </>
    );
  }

  const renderPillarContent = (pillarId: string) => {
    switch (pillarId) {
      case 'mindset':
        return (
          <div className="space-y-4">
            <StrengthSpotlight pillarId="mindset" />
            <PersonalityAnalyzer onComplete={handlePersonalityTestComplete} />
            {journalEntries.length > 0 && (
              <Button
                onClick={() => handleFeedToAnalyzer(journalEntries[0])}
                className="w-full"
                style={{ background: 'var(--color-accent)', color: 'white' }}
              >
                Feed Latest Journal to Analyzer 🧠
              </Button>
            )}
            {selectedJournalForAnalysis && (
              <JournalAnalyzer
                journalEntry={selectedJournalForAnalysis}
                onClose={() => setSelectedJournalForAnalysis(undefined)}
                onTaskSuggestion={handleTaskSuggestion}
              />
            )}

            {/* Journal Entry in Mindset */}
            <Card className="border-2" style={{ borderColor: 'var(--color-primary)', background: 'var(--bg-secondary)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--text-primary)' }}>📓 Daily Journal</CardTitle>
                <CardDescription style={{ color: 'var(--text-secondary)' }}>
                  Capture your wins, struggles, and reflections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedJournal
                  entries={journalEntries}
                  onAddEntry={handleAddJournalEntry}
                  onFeedToAnalyzer={handleFeedToAnalyzer}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'values':
        return (
          <div className="space-y-4">
            <StrengthSpotlight pillarId="values" />
            <ValuesEditor
              values={profile.values}
              onValuesChange={handleValuesChange}
              personalityType={profile.personalityType}
            />
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-4">
            <StrengthSpotlight pillarId="goals" />
            <GoalTracker goals={goals} onAddGoal={handleAddGoal} onUpdateProgress={handleUpdateProgress} />
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-4">
            <StrengthSpotlight pillarId="schedule" />
            <CalendarScheduler />
          </div>
        );

      case 'growth':
        return (
          <div className="space-y-4">
            <StrengthSpotlight pillarId="growth" />
            <GamificationTile />
          </div>
        );

      case 'energy':
        return (
          <div className="space-y-4">
            <StrengthSpotlight pillarId="energy" />
            <EnergyTracker journalEntries={journalEntries} />
          </div>
        );

      case 'impact':
        return (
          <div className="space-y-4">
            <StrengthSpotlight pillarId="impact" />
            <ImpactTracker journalEntries={journalEntries} goals={goals} />
          </div>
        );

      case 'vibe':
        return (
          <div className="space-y-6">
            <StrengthSpotlight pillarId="vibe" />
            <ThemeSettings />
            <PillarReorder pillars={pillars} onReorder={handlePillarReorder} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        className="min-h-screen flex flex-col dark"
        style={{ background: 'var(--bg-primary)' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Navigation Bar */}
        <div
          className="sticky top-0 z-50 border-b flex-shrink-0"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {activePillar && (
                <button
                  onClick={handleBackToOverview}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Back to overview"
                >
                  <ArrowLeft className="h-6 w-6" style={{ color: 'var(--text-primary)' }} />
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" style={{ color: 'var(--text-primary)' }} />
                ) : (
                  <Menu className="h-6 w-6" style={{ color: 'var(--text-primary)' }} />
                )}
              </button>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>
                YOU
              </h1>
            </div>
            <p className="hidden md:block text-sm" style={{ color: 'var(--text-secondary)' }}>
              {activePillar
                ? pillars.find(p => p.id === activePillar)?.title
                : `Hey ${user?.email?.split('@')[0] || 'there'}, ready to reflect?`}
            </p>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation (Desktop) */}
          <aside
            className={`
              fixed lg:sticky top-[73px] left-0 z-40 h-[calc(100vh-73px)]
              w-64 p-6 border-r transition-transform duration-300 flex-shrink-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <nav className="space-y-2">
              {pillars.map((pillar) => (
                <button
                  key={pillar.id}
                  onClick={() => handlePillarClick(pillar.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
                    ${activePillar === pillar.id ? 'shadow-lg' : 'hover:bg-white/10'}
                  `}
                  style={{
                    background: activePillar === pillar.id ? 'var(--color-accent)' : 'transparent',
                  }}
                >
                  <span className="text-2xl">{pillar.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-semibold"
                      style={{
                        color: activePillar === pillar.id ? '#ffffff' : 'var(--text-primary)'
                      }}
                    >
                      {pillar.title}
                    </div>
                    <div
                      className="text-xs truncate"
                      style={{
                        color: activePillar === pillar.id ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-secondary)'
                      }}
                    >
                      {pillar.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main
            className="flex-1 overflow-y-auto"
            style={{ height: 'calc(100vh - 73px)' }}
          >
            {activePillar ? (
              // Full-screen pillar view
              <div className="h-full p-6 animate-in fade-in duration-300">
                <div className="max-w-5xl mx-auto">
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-5xl">
                        {pillars.find(p => p.id === activePillar)?.icon}
                      </span>
                      <div>
                        <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {pillars.find(p => p.id === activePillar)?.title}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {pillars.find(p => p.id === activePillar)?.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                  {renderPillarContent(activePillar)}
                </div>
              </div>
            ) : (
              // Overview grid
              <div className="p-6">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Your Life Pillars
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Click a pillar to dive in and work on your personal growth
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pillars.map((pillar) => (
                      <button
                        key={pillar.id}
                        onClick={() => handlePillarClick(pillar.id)}
                        className="p-6 rounded-lg border-2 hover:scale-105 transition-all text-left"
                        style={{
                          background: 'var(--bg-secondary)',
                          borderColor: 'var(--color-accent)',
                        }}
                      >
                        <div className="text-5xl mb-3">{pillar.icon}</div>
                        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                          {pillar.title}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {pillar.subtitle}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t overflow-x-auto"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex">
              <button
                onClick={handleBackToOverview}
                className={`
                  flex-shrink-0 flex flex-col items-center justify-center gap-1 p-3 min-w-[70px]
                  ${!activePillar ? 'opacity-100' : 'opacity-60'}
                `}
                style={{
                  background: !activePillar ? 'var(--color-accent)' : 'transparent',
                }}
              >
                <Grid className="h-6 w-6" style={{ color: !activePillar ? '#ffffff' : 'var(--text-primary)' }} />
                <span
                  className="text-xs"
                  style={{
                    color: !activePillar ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  All
                </span>
              </button>
              {pillars.map((pillar) => (
                <button
                  key={pillar.id}
                  onClick={() => handlePillarClick(pillar.id)}
                  className={`
                    flex-shrink-0 flex flex-col items-center justify-center gap-1 p-3 min-w-[70px]
                    ${activePillar === pillar.id ? 'opacity-100' : 'opacity-60'}
                  `}
                  style={{
                    background: activePillar === pillar.id ? 'var(--color-accent)' : 'transparent',
                  }}
                >
                  <span className="text-2xl">{pillar.icon}</span>
                  <span
                    className="text-xs"
                    style={{
                      color: activePillar === pillar.id ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    {pillar.title}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>
      <Toaster />
    </>
  );
}
