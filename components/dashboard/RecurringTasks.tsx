import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { RecurringTask } from '../../types/dashboard';
import { differenceInDays } from 'date-fns';

interface RecurringTasksProps {
  tasks: RecurringTask[];
  onToggleTask: (taskId: string) => void;
  onResetWeeklyTasks: () => void;
}

export function RecurringTasks({
  tasks,
  onToggleTask,
  onResetWeeklyTasks,
}: RecurringTasksProps) {
  const weeklyTasks = tasks.filter((t) => t.frequency === 'weekly');
  const completedCount = weeklyTasks.filter((t) => t.completed).length;
  const totalCount = weeklyTasks.length;

  const shouldShowReset = () => {
    const lastReset = weeklyTasks[0]?.lastReset;
    if (!lastReset) return false;
    return differenceInDays(new Date(), new Date(lastReset)) >= 7;
  };

  const getFrequencyColor = (frequency: RecurringTask['frequency']) => {
    switch (frequency) {
      case 'daily':
        return 'bg-blue-500';
      case 'weekly':
        return 'bg-green-500';
      case 'monthly':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recurring Tasks</CardTitle>
            <CardDescription>
              {completedCount} of {totalCount} weekly tasks completed
            </CardDescription>
          </div>
          {shouldShowReset() && (
            <Button onClick={onResetWeeklyTasks} variant="outline" size="sm">
              Reset Weekly Tasks
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <Checkbox
                id={task.id}
                checked={task.completed}
                onCheckedChange={() => onToggleTask(task.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <label
                    htmlFor={task.id}
                    className={`text-sm font-medium cursor-pointer ${
                      task.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {task.title}
                  </label>
                  <Badge className={getFrequencyColor(task.frequency)}>
                    {task.frequency}
                  </Badge>
                </div>
                <p
                  className={`text-sm text-muted-foreground ${
                    task.completed ? 'line-through' : ''
                  }`}
                >
                  {task.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((completedCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
