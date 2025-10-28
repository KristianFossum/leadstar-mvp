import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Trophy, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  fetchGamification,
  calculateLevel,
  getProgressToNextLevel,
  type GamificationData,
  type Badge as GamificationBadge
} from '@/lib/gamification'

export function GamificationTile() {
  const [gamification, setGamification] = useState<GamificationData | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGamification()

    // Set up realtime subscription
    const channel = supabase
      .channel('gamification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gamification'
        },
        () => {
          loadGamification()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadGamification() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const data = await fetchGamification(user.id)
      setGamification(data)
    } catch (err) {
      console.error('Error loading gamification:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-purple-200 rounded w-3/4"></div>
            <div className="h-4 bg-purple-200 rounded w-1/2"></div>
            <div className="h-2 bg-purple-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!gamification) {
    return null
  }

  const levelData = calculateLevel(gamification.total_xp)
  const progress = getProgressToNextLevel(gamification.total_xp, gamification.current_level)
  const latestBadges = gamification.badges.slice(-3).reverse()

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-purple-200 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Leadership Journey
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level and XP */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-purple-900">
              Level {gamification.current_level} – {levelData.title}
            </span>
            <span className="text-xs text-purple-700 font-medium">
              {gamification.total_xp} / {progress.max + (levelData.minXP || 0)} XP
            </span>
          </div>
          <Progress value={progress.percentage} className="h-3 bg-purple-200">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </Progress>
          <p className="text-xs text-purple-600 mt-1 text-center">
            {progress.current} / {progress.max} XP to next level
          </p>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-center gap-2 bg-white/60 rounded-lg p-3 border border-orange-200">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-semibold text-orange-900">
            {gamification.streak_count}-day journal streak
          </span>
          {gamification.streak_count >= 3 && <span className="text-lg">🔥</span>}
        </div>

        {/* Latest Badges */}
        {latestBadges.length > 0 && (
          <div>
            <p className="text-xs text-purple-700 font-semibold mb-2">Latest Badges:</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {latestBadges.map((badge: GamificationBadge, idx: number) => (
                <Badge
                  key={`${badge.id}-${idx}`}
                  variant="secondary"
                  className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border-yellow-300 flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-sm"
                >
                  <span className="text-lg">{badge.emoji}</span>
                  <span className="font-semibold">{badge.name}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Expanded Badge Gallery */}
        {isExpanded && gamification.badges.length > 0 && (
          <div className="border-t border-purple-200 pt-4 mt-4">
            <p className="text-sm font-bold text-purple-900 mb-3">All Badges:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gamification.badges.map((badge: GamificationBadge, idx: number) => (
                <div
                  key={`${badge.id}-${idx}`}
                  className="bg-white/80 rounded-lg p-3 border border-purple-200 flex flex-col items-center gap-1 hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl">{badge.emoji}</span>
                  <span className="text-xs font-semibold text-purple-900 text-center">
                    {badge.name}
                  </span>
                  <span className="text-xs text-purple-600">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {!isExpanded && (
          <p className="text-xs text-center text-purple-700 italic">
            Keep going! Every action brings you closer to becoming the leader you aspire to be. 🌟
          </p>
        )}
      </CardContent>
    </Card>
  )
}
