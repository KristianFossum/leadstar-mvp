import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Lightbulb, BookOpen, Bell, ExternalLink, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import type { CoachingPlan } from '../../types/you-view';

interface CoachingPlanCardProps {
  plan?: CoachingPlan;
  onRefresh?: () => void;
}

export function CoachingPlanCard({ plan, onRefresh }: CoachingPlanCardProps) {
  const [completedTips, setCompletedTips] = useState<Set<string>>(new Set());

  const handleToggleTip = (tipId: string) => {
    const newCompleted = new Set(completedTips);
    if (newCompleted.has(tipId)) {
      newCompleted.delete(tipId);
    } else {
      newCompleted.add(tipId);
    }
    setCompletedTips(newCompleted);
  };

  const categoryColors = {
    communication: 'bg-blue-500',
    leadership: 'bg-purple-500',
    productivity: 'bg-green-500',
    wellbeing: 'bg-pink-500',
    growth: 'bg-orange-500',
  };

  const categoryLabels = {
    communication: 'Communication',
    leadership: 'Leadership',
    productivity: 'Productivity',
    wellbeing: 'Well-being',
    growth: 'Growth',
  };

  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  };

  const resourceIcons = {
    article: '📄',
    video: '🎥',
    book: '📚',
    course: '🎓',
    podcast: '🎧',
  };

  if (!plan) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Your Coaching Plan
              </CardTitle>
              <CardDescription>
                Personalized tips and resources
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">Complete your personality test</p>
            <p className="text-sm">to receive a personalized coaching plan!</p>
            {onRefresh && (
              <Button className="mt-4" onClick={onRefresh}>
                Generate Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {plan.title}
            </CardTitle>
            <CardDescription>
              Updated {format(plan.lastUpdated, 'MMM d, yyyy')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm">{plan.description}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Based on: {plan.basedOnPersonality}
          </p>
        </div>

        <Accordion type="multiple" className="w-full">
          <AccordionItem value="tips">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>Coaching Tips ({plan.tips.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-4">
                  {plan.tips.map((tip) => (
                    <div
                      key={tip.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        completedTips.has(tip.id)
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                          : 'bg-background border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm">{tip.title}</h4>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${categoryColors[tip.category]} text-white`}
                            >
                              {categoryLabels[tip.category]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tip.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs font-medium ${priorityColors[tip.priority]}`}>
                              {tip.priority.toUpperCase()} Priority
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTip(tip.id)}
                          className={completedTips.has(tip.id) ? 'text-green-600' : ''}
                        >
                          <CheckCircle2
                            className={`h-5 w-5 ${completedTips.has(tip.id) ? 'fill-current' : ''}`}
                          />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="resources">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>Learning Resources ({plan.resources.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-3 pr-4">
                  {plan.resources.map((resource) => (
                    <div key={resource.id} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{resourceIcons[resource.type]}</span>
                            <h4 className="font-semibold text-sm">{resource.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {resource.description}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {resource.type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="reminders">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span>Daily Reminders ({plan.dailyReminders.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {plan.dailyReminders.map((reminder, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg"
                  >
                    <Bell className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{reminder}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
