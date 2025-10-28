import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Sparkles, TrendingUp, Target, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import type { AIInsight } from '../../types/you-view';

interface AIInsightsCardProps {
  insight?: AIInsight;
  onRefresh?: () => void;
  loading?: boolean;
}

export function AIInsightsCard({ insight, onRefresh, loading }: AIInsightsCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsRefreshing(true);
    } else {
      setIsRefreshing(false);
    }
  }, [loading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const callXAIAPI = async (journalData: any, personalityData: any, kpiData: any) => {
    const xaiApiKey = import.meta.env.VITE_XAI_API_KEY;

    if (!xaiApiKey) {
      console.warn('xAI API key not configured. Using mock data.');
      return null;
    }

    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiApiKey}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an empathetic leadership coach. Provide supportive feedback based on journal entries, personality traits, and KPIs. Give 1 empathetic comment, 1 actionable tip, and explain how this connects to their goals.',
            },
            {
              role: 'user',
              content: `Journal: ${JSON.stringify(journalData)}. Personality: ${JSON.stringify(personalityData)}. KPIs: ${JSON.stringify(kpiData)}`,
            },
          ],
          model: 'grok-beta',
          stream: false,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from xAI API');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content;
    } catch (error) {
      console.error('Error calling xAI API:', error);
      return null;
    }
  };

  if (!insight) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription>
                Personalized feedback based on your data
              </CardDescription>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Complete your journal and personality test</p>
            <p className="text-sm">to receive personalized AI insights!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Today's Insights
            </CardTitle>
            <CardDescription>
              {format(insight.date, 'MMMM d, yyyy')}
            </CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg">
            <div className="flex-shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-lg">💙</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-1">
                You're doing great!
              </h3>
              <p className="text-sm">{insight.empatheticComment}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg">
            <div className="flex-shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-green-600 dark:text-green-400 mb-1">
                Action Tip
              </h3>
              <p className="text-sm">{insight.actionTip}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg">
            <div className="flex-shrink-0 mt-1">
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-purple-600 dark:text-purple-400 mb-1">
                Goal Connection
              </h3>
              <p className="text-sm">{insight.goalConnection}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/50 dark:border-gray-800">
          <div className="flex gap-2 flex-wrap">
            {insight.basedOn.journalEntries && (
              <Badge variant="secondary" className="text-xs">
                📔 Journal
              </Badge>
            )}
            {insight.basedOn.personality && (
              <Badge variant="secondary" className="text-xs">
                🧠 Personality
              </Badge>
            )}
            {insight.basedOn.kpis && (
              <Badge variant="secondary" className="text-xs">
                📊 KPIs
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
