import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SuperhumanInsight } from './SuperhumanInsight';
import { ScenarioSimulator } from './ScenarioSimulator';
import { GrowthRadar } from './GrowthRadar';
import { AskCoach } from './AskCoach';
import { AIAgent } from './AIAgent';
import { useCoachData } from '@/hooks/useCoachData';

export function CoachView() {
  const { user } = useAuth();
  const { insight, loading, refreshInsight } = useCoachData(user?.id);

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] pb-20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Your AI Coach
          </h1>
          <p className="text-gray-400">
            Personal insights powered by your growth data
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Superhuman Insight - Full width on mobile, left column on desktop */}
          <div className="lg:col-span-2">
            <SuperhumanInsight insight={insight} loading={loading} onRefresh={refreshInsight} />
          </div>

          {/* Scenario Simulator */}
          <div>
            <ScenarioSimulator />
          </div>

          {/* Growth Radar */}
          <div>
            <GrowthRadar />
          </div>
        </div>

        {/* Ask Coach - Floating Chat */}
        <AskCoach />

        {/* AI Agent - Smart Sidekick */}
        <AIAgent />
      </div>
    </div>
  );
}
