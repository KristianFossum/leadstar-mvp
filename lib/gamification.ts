import { supabase } from './supabase'

export interface Badge {
  id: string
  name: string
  emoji: string
  earnedAt: string
}

export interface GamificationData {
  id: string
  user_id: string
  total_xp: number
  current_level: number
  streak_count: number
  streak_last_date: string | null
  badges: Badge[]
  created_at: string
  updated_at: string
}

// Level thresholds
const LEVEL_THRESHOLDS = [
  { level: 1, minXP: 0, maxXP: 500, title: 'Emerging Leader 🌱' },
  { level: 2, minXP: 500, maxXP: 1200, title: 'Growing Leader 🌿' },
  { level: 3, minXP: 1200, maxXP: 2500, title: 'Rising Star ⭐' },
  { level: 4, minXP: 2500, maxXP: 5000, title: 'Confident Leader 💪' },
  { level: 5, minXP: 5000, maxXP: 10000, title: 'Inspiring Leader 🌟' },
  { level: 6, minXP: 10000, maxXP: 20000, title: 'Master Leader 👑' },
  { level: 7, minXP: 20000, maxXP: 40000, title: 'Visionary Leader 🚀' },
  { level: 8, minXP: 40000, maxXP: Infinity, title: 'Legendary Leader 🏆' }
]

// XP rewards
export const XP_REWARDS = {
  JOURNAL_SUBMIT: 50,
  TASK_COMPLETE: 30,
  PERSONALITY_FOLLOWUP: 75,
  PERSONALITY_UPDATE: 100,
  GOAL_MILESTONE_25: 200,
  GOAL_MILESTONE_50: 200,
  GOAL_MILESTONE_100: 200
}

// Badge definitions
export const BADGE_DEFINITIONS = {
  FIRST_REFLECTION: { id: 'first_reflection', name: 'First Reflection', emoji: '📓' },
  TASK_MASTER: { id: 'task_master', name: 'Task Master', emoji: '✅' },
  MIND_EXPLORER: { id: 'mind_explorer', name: 'Mind Explorer', emoji: '🧠' },
  GOAL_CRUSHER: { id: 'goal_crusher', name: 'Goal Crusher', emoji: '🏆' },
  CONSISTENCY_KING: { id: 'consistency_king', name: 'Consistency King', emoji: '👑' },
  WEEK_WARRIOR: { id: 'week_warrior', name: 'Week Warrior', emoji: '🔥' },
  DEDICATED_SCHOLAR: { id: 'dedicated_scholar', name: 'Dedicated Scholar', emoji: '📚' },
  MILESTONE_MASTER: { id: 'milestone_master', name: 'Milestone Master', emoji: '🎯' }
}

export function calculateLevel(xp: number): { level: number; title: string; minXP: number; maxXP: number } {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = LEVEL_THRESHOLDS[i]
    if (xp >= threshold.minXP) {
      return threshold
    }
  }
  return LEVEL_THRESHOLDS[0]
}

export function getNextLevelThreshold(currentLevel: number): number {
  const nextLevelData = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1)
  return nextLevelData ? nextLevelData.minXP : Infinity
}

export function getProgressToNextLevel(xp: number, currentLevel: number): { current: number; max: number; percentage: number } {
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel)
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1)

  if (!currentThreshold || !nextThreshold) {
    return { current: xp, max: xp, percentage: 100 }
  }

  const current = xp - currentThreshold.minXP
  const max = nextThreshold.minXP - currentThreshold.minXP
  const percentage = Math.min(100, Math.round((current / max) * 100))

  return { current, max, percentage }
}

export async function getOrCreateGamification(userId: string): Promise<GamificationData | null> {
  try {
    // Try to fetch existing gamification data
    const { data, error } = await supabase
      .from('gamification')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching gamification:', error)
      return null
    }

    // If exists, return it
    if (data) {
      return data as GamificationData
    }

    // Otherwise, create new gamification record
    const { data: newData, error: insertError } = await supabase
      .from('gamification')
      .insert({
        user_id: userId,
        total_xp: 0,
        current_level: 1,
        streak_count: 0,
        streak_last_date: null,
        badges: []
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating gamification:', insertError)
      return null
    }

    return newData as GamificationData
  } catch (err) {
    console.error('Unexpected error in getOrCreateGamification:', err)
    return null
  }
}

export async function awardXP(
  userId: string,
  xpAmount: number,
  reason: string
): Promise<{
  success: boolean
  leveledUp: boolean
  newLevel?: number
  newXP?: number
  unlockedBadge?: Badge
}> {
  try {
    const gamification = await getOrCreateGamification(userId)
    if (!gamification) {
      return { success: false, leveledUp: false }
    }

    const newXP = gamification.total_xp + xpAmount
    const oldLevel = gamification.current_level
    const newLevelData = calculateLevel(newXP)
    const leveledUp = newLevelData.level > oldLevel

    // Check for new badge unlocks
    let unlockedBadge: Badge | undefined

    // First reflection badge
    if (reason === 'journal' && gamification.badges.length === 0) {
      unlockedBadge = {
        ...BADGE_DEFINITIONS.FIRST_REFLECTION,
        earnedAt: new Date().toISOString()
      }
    }

    // Task master badge (complete 10 tasks)
    if (reason === 'task') {
      const taskBadgeCount = gamification.badges.filter(b => b.id === BADGE_DEFINITIONS.TASK_MASTER.id).length
      const totalTasks = Math.floor((newXP - (gamification.badges.filter(b => b.id === BADGE_DEFINITIONS.FIRST_REFLECTION.id).length * 50)) / XP_REWARDS.TASK_COMPLETE)
      if (totalTasks >= 10 && taskBadgeCount === 0) {
        unlockedBadge = {
          ...BADGE_DEFINITIONS.TASK_MASTER,
          earnedAt: new Date().toISOString()
        }
      }
    }

    // Mind explorer badge (complete personality followup)
    if (reason === 'personality_followup' && !gamification.badges.find(b => b.id === BADGE_DEFINITIONS.MIND_EXPLORER.id)) {
      unlockedBadge = {
        ...BADGE_DEFINITIONS.MIND_EXPLORER,
        earnedAt: new Date().toISOString()
      }
    }

    // Goal crusher badge (hit any goal milestone)
    if (reason.startsWith('goal_milestone') && !gamification.badges.find(b => b.id === BADGE_DEFINITIONS.GOAL_CRUSHER.id)) {
      unlockedBadge = {
        ...BADGE_DEFINITIONS.GOAL_CRUSHER,
        earnedAt: new Date().toISOString()
      }
    }

    const newBadges = unlockedBadge
      ? [...gamification.badges, unlockedBadge]
      : gamification.badges

    // Update gamification record
    const { error } = await supabase
      .from('gamification')
      .update({
        total_xp: newXP,
        current_level: newLevelData.level
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating XP:', error)
      return { success: false, leveledUp: false }
    }

    // Update badges separately if new badge unlocked
    if (unlockedBadge) {
      await supabase
        .from('gamification')
        .update({ badges: newBadges })
        .eq('user_id', userId)
    }

    return {
      success: true,
      leveledUp,
      newLevel: leveledUp ? newLevelData.level : undefined,
      newXP,
      unlockedBadge
    }
  } catch (err) {
    console.error('Error awarding XP:', err)
    return { success: false, leveledUp: false }
  }
}

export async function updateStreak(userId: string): Promise<{ success: boolean; streakCount: number; unlockedBadge?: Badge }> {
  try {
    const gamification = await getOrCreateGamification(userId)
    if (!gamification) {
      return { success: false, streakCount: 0 }
    }

    const today = new Date().toISOString().split('T')[0]
    const lastDate = gamification.streak_last_date

    let newStreakCount = gamification.streak_count
    let unlockedBadge: Badge | undefined

    if (!lastDate) {
      // First entry ever
      newStreakCount = 1
    } else {
      const lastDateObj = new Date(lastDate)
      const todayObj = new Date(today)
      const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        // Consecutive day
        newStreakCount += 1
      } else if (diffDays > 1) {
        // Streak broken
        newStreakCount = 1
      }
      // If diffDays === 0, already journaled today, no change
    }

    // Check for streak badges
    if (newStreakCount >= 7 && !gamification.badges.find(b => b.id === BADGE_DEFINITIONS.CONSISTENCY_KING.id)) {
      unlockedBadge = {
        ...BADGE_DEFINITIONS.CONSISTENCY_KING,
        earnedAt: new Date().toISOString()
      }
    }

    // Update streak
    const updates: any = {
      streak_count: newStreakCount,
      streak_last_date: today
    }

    if (unlockedBadge) {
      updates.badges = [...gamification.badges, unlockedBadge]
    }

    const { error } = await supabase
      .from('gamification')
      .update(updates)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating streak:', error)
      return { success: false, streakCount: newStreakCount }
    }

    return { success: true, streakCount: newStreakCount, unlockedBadge }
  } catch (err) {
    console.error('Error updating streak:', err)
    return { success: false, streakCount: 0 }
  }
}

export async function fetchGamification(userId: string): Promise<GamificationData | null> {
  return await getOrCreateGamification(userId)
}
