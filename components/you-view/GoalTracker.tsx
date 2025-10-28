import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Target, Plus, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { PersonalGoal } from '../../types/you-view';

interface GoalTrackerProps {
  goals: PersonalGoal[];
  onAddGoal: (goal: Omit<PersonalGoal, 'id' | 'createdDate'>) => void;
  onUpdateProgress: (goalId: string, progress: number) => void;
}

export function GoalTracker({ goals, onAddGoal, onUpdateProgress }: GoalTrackerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'professional' as PersonalGoal['type'],
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
    targetDate: '',
    progress: 0,
  });

  const handleSubmit = () => {
    if (formData.title && formData.targetDate) {
      onAddGoal({
        ...formData,
        targetDate: new Date(formData.targetDate),
        linkedJournalEntries: [],
        linkedTasks: [],
        status: 'not-started',
      });
      setFormData({
        title: '',
        description: '',
        type: 'professional',
        specific: '',
        measurable: '',
        achievable: '',
        relevant: '',
        timeBound: '',
        targetDate: '',
        progress: 0,
      });
      setIsDialogOpen(false);
    }
  };

  const goalTypeColors = {
    personal: 'bg-blue-500',
    professional: 'bg-purple-500',
    health: 'bg-green-500',
    leadership: 'bg-orange-500',
  };

  const goalTypeLabels = {
    personal: 'Personal',
    professional: 'Professional',
    health: 'Health',
    leadership: 'Leadership',
  };

  const statusColors = {
    'not-started': 'bg-gray-500',
    'in-progress': 'bg-blue-500',
    'completed': 'bg-green-500',
    'on-hold': 'bg-yellow-500',
  };

  const chartData = goals.map((goal) => ({
    name: goal.title.length > 15 ? goal.title.substring(0, 15) + '...' : goal.title,
    progress: goal.progress,
  }));

  const progressOverTime = [
    { month: 'Jan', avgProgress: 15 },
    { month: 'Feb', avgProgress: 28 },
    { month: 'Mar', avgProgress: 42 },
    { month: 'Apr', avgProgress: 55 },
    { month: 'May', avgProgress: 68 },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Personal Goals
            </CardTitle>
            <CardDescription>
              Track your SMART goals and progress
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create a SMART Goal</DialogTitle>
                <DialogDescription>
                  Set a specific, measurable, achievable, relevant, and time-bound goal
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Goal Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Improve Time Management"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your goal"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Goal Type</Label>
                    <Select value={formData.type} onValueChange={(value: PersonalGoal['type']) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="leadership">Leadership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="targetDate">Target Date *</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm">SMART Criteria</h4>
                  <div>
                    <Label htmlFor="specific" className="text-xs">Specific - What exactly will you achieve?</Label>
                    <Input
                      id="specific"
                      placeholder="e.g., Reduce meeting time by 20%"
                      value={formData.specific}
                      onChange={(e) => setFormData({ ...formData, specific: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="measurable" className="text-xs">Measurable - How will you track progress?</Label>
                    <Input
                      id="measurable"
                      placeholder="e.g., Track calendar time weekly"
                      value={formData.measurable}
                      onChange={(e) => setFormData({ ...formData, measurable: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="achievable" className="text-xs">Achievable - How will you accomplish this?</Label>
                    <Input
                      id="achievable"
                      placeholder="e.g., Decline non-essential meetings"
                      value={formData.achievable}
                      onChange={(e) => setFormData({ ...formData, achievable: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="relevant" className="text-xs">Relevant - Why is this important?</Label>
                    <Input
                      id="relevant"
                      placeholder="e.g., Critical for career growth"
                      value={formData.relevant}
                      onChange={(e) => setFormData({ ...formData, relevant: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeBound" className="text-xs">Time-Bound - When will you achieve this?</Label>
                    <Input
                      id="timeBound"
                      placeholder="e.g., By end of Q2 2025"
                      value={formData.timeBound}
                      onChange={(e) => setFormData({ ...formData, timeBound: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={!formData.title || !formData.targetDate}>
                    Create Goal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.length > 0 && (
          <div className="space-y-4">
            <div className="h-[200px]">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Goal Progress
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[200px]">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress Over Time
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgProgress" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No goals yet. Create your first SMART goal!</p>
              </div>
            ) : (
              goals.map((goal) => (
                <Card key={goal.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-base">{goal.title}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {goalTypeLabels[goal.type]}
                          </Badge>
                        </div>
                        {goal.description && (
                          <CardDescription className="text-sm">
                            {goal.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(goal.targetDate, 'MMM d, yyyy')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-bold">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                    {(goal.specific || goal.measurable) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {goal.specific && (
                          <div>
                            <span className="font-medium text-muted-foreground">Specific:</span>
                            <p className="mt-1">{goal.specific}</p>
                          </div>
                        )}
                        {goal.measurable && (
                          <div>
                            <span className="font-medium text-muted-foreground">Measurable:</span>
                            <p className="mt-1">{goal.measurable}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge variant="outline" className={`${statusColors[goal.status]} text-white`}>
                        {goal.status.replace('-', ' ')}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newProgress = Math.min(goal.progress + 10, 100);
                          onUpdateProgress(goal.id, newProgress);
                        }}
                      >
                        Update Progress
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
