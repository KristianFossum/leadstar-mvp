import { supabase } from '@/lib/supabase';
import type { AgentAction } from './grokService';

export interface ActionResult {
  success: boolean;
  message: string;
  xp?: number;
  badge?: string;
}

export async function executeAgentActions(
  userId: string,
  actions: AgentAction[]
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of actions) {
    try {
      let result: ActionResult;

      switch (action.type) {
        case 'journal':
          result = await updateJournal(userId, action);
          break;
        case 'goal':
          result = await updateGoal(userId, action);
          break;
        case 'task':
          result = await createTask(userId, action);
          break;
        case 'energy':
          result = await updateEnergy(userId, action);
          break;
        case 'impact':
          result = await updateImpact(userId, action);
          break;
        case 'growth':
          result = await updateGrowth(userId, action);
          break;
        case 'values':
          result = await updateValues(userId, action);
          break;
        case 'vibe':
          result = await updateVibe(userId, action);
          break;
        case 'question':
          result = {
            success: true,
            message: action.message || 'Question pending',
          };
          break;
        default:
          result = {
            success: false,
            message: `Unknown action type: ${action.type}`,
          };
      }

      results.push(result);
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      results.push({
        success: false,
        message: `Failed to execute ${action.type}`,
      });
    }
  }

  return results;
}

async function updateJournal(userId: string, action: AgentAction): Promise<ActionResult> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: existingEntry } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', todayStart.toISOString())
    .single();

  const journalData = {
    user_id: userId,
    wins: action.data?.wins || [],
    struggles: action.data?.struggles || [],
    mood: action.data?.mood || 'neutral',
    reflections: action.data?.reflections || '',
    date: new Date().toISOString(),
  };

  if (existingEntry) {
    // Update existing entry
    const { error } = await supabase
      .from('journal_entries')
      .update({
        wins: [...(existingEntry.wins || []), ...(journalData.wins || [])],
        struggles: [...(existingEntry.struggles || []), ...(journalData.struggles || [])],
        mood: journalData.mood,
        reflections: existingEntry.reflections
          ? `${existingEntry.reflections}\n${journalData.reflections}`
          : journalData.reflections,
      })
      .eq('id', existingEntry.id);

    if (error) throw error;
  } else {
    // Create new entry
    const { error } = await supabase.from('journal_entries').insert(journalData);
    if (error) throw error;
  }

  // Update gamification
  if (action.xp) {
    await addXP(userId, action.xp);
  }

  return {
    success: true,
    message: 'Journal updated',
    xp: action.xp,
    badge: action.badge,
  };
}

async function updateGoal(userId: string, action: AgentAction): Promise<ActionResult> {
  if (action.data?.id) {
    // Update existing goal
    const { error } = await supabase
      .from('goals')
      .update({
        progress: action.data.progress,
        milestones: action.data.milestones,
      })
      .eq('id', action.data.id)
      .eq('user_id', userId);

    if (error) throw error;
  } else {
    // Create new goal
    const { error } = await supabase.from('goals').insert({
      user_id: userId,
      title: action.data?.title,
      description: action.data?.description,
      target: action.data?.target,
      progress: action.data?.progress || 0,
      milestones: action.data?.milestones || [],
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  }

  // Update gamification
  if (action.xp) {
    await addXP(userId, action.xp);
  }

  return {
    success: true,
    message: 'Goal updated',
    xp: action.xp,
    badge: action.badge,
  };
}

async function createTask(userId: string, action: AgentAction): Promise<ActionResult> {
  let taskDate: string;

  if (action.data?.date === 'tomorrow') {
    taskDate = new Date(Date.now() + 86400000).toISOString();
  } else if (action.data?.date === 'today' || !action.data?.date) {
    taskDate = new Date().toISOString();
  } else {
    // Try to parse as date string
    taskDate = new Date(action.data.date).toISOString();
  }

  const { error } = await supabase.from('tasks').insert({
    user_id: userId,
    title: action.data?.title || 'New task',
    description: action.data?.description || '',
    task_date: taskDate,
    repeat_type: action.data?.repeat_type || 'none',
    repeat_interval: action.data?.repeat_interval || 0,
    reminder: action.data?.reminder || false,
    completed: false,
    emoji: action.data?.emoji || '📅',
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  console.log('✅ Task created successfully:', action.data?.title);

  return {
    success: true,
    message: `Task added to calendar: ${action.data?.title}`,
    xp: action.xp || 30,
  };
}

async function updateEnergy(userId: string, action: AgentAction): Promise<ActionResult> {
  // Energy is tracked via journal mood, so we update the journal
  return updateJournal(userId, {
    type: 'journal',
    data: {
      mood: action.data?.mood || 'neutral',
      reflections: action.data?.reflections || '',
    },
    xp: action.xp,
  });
}

async function updateImpact(userId: string, action: AgentAction): Promise<ActionResult> {
  // Impact/KPIs can be stored in a separate table or added to journal
  // For now, we'll add it to journal reflections
  return updateJournal(userId, {
    type: 'journal',
    data: {
      reflections: `Impact: ${JSON.stringify(action.data)}`,
    },
    xp: action.xp,
  });
}

async function updateGrowth(userId: string, action: AgentAction): Promise<ActionResult> {
  if (action.xp) {
    await addXP(userId, action.xp);
  }

  return {
    success: true,
    message: 'XP added',
    xp: action.xp,
    badge: action.badge,
  };
}

async function updateValues(userId: string, action: AgentAction): Promise<ActionResult> {
  // Values can be stored in user_profile or user_settings
  const { error } = await supabase
    .from('user_profile')
    .upsert({
      user_id: userId,
      values: action.data?.values || [],
    }, {
      onConflict: 'user_id',
    });

  if (error) throw error;

  return {
    success: true,
    message: 'Values updated',
  };
}

async function updateVibe(userId: string, action: AgentAction): Promise<ActionResult> {
  // Update theme/palette in user_settings
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      palette: action.data?.palette,
      custom_colors: action.data?.custom_colors,
    }, {
      onConflict: 'user_id',
    });

  if (error) throw error;

  return {
    success: true,
    message: 'Theme updated',
  };
}

async function addXP(userId: string, xp: number): Promise<void> {
  // Get current gamification data
  const { data: current } = await supabase
    .from('gamification')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!current) {
    // Create new gamification record
    await supabase.from('gamification').insert({
      user_id: userId,
      total_xp: xp,
      current_level: 1,
      streak_count: 1,
      streak_last_date: new Date().toISOString().split('T')[0],
      badges: [],
    });
  } else {
    // Update existing record
    const newXP = current.total_xp + xp;
    const newLevel = calculateLevel(newXP);

    // Check for badges
    const newBadges = checkBadges(current, newXP, newLevel);

    await supabase
      .from('gamification')
      .update({
        total_xp: newXP,
        current_level: newLevel,
        badges: [...(current.badges || []), ...newBadges],
      })
      .eq('user_id', userId);
  }
}

function calculateLevel(xp: number): number {
  if (xp < 500) return 1;
  if (xp < 1200) return 2;
  if (xp < 2500) return 3;
  if (xp < 5000) return 4;
  return Math.floor(5 + (xp - 5000) / 2000);
}

function checkBadges(current: any, newXP: number, newLevel: number): string[] {
  const badges: string[] = [];

  // Level-up badge
  if (newLevel > current.current_level) {
    badges.push(`Level ${newLevel} Unlocked`);
  }

  // XP milestones
  if (current.total_xp < 1000 && newXP >= 1000) {
    badges.push('1K XP Master');
  }
  if (current.total_xp < 5000 && newXP >= 5000) {
    badges.push('5K XP Champion');
  }

  return badges;
}
