import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X } from 'lucide-react';
import type { Task } from '../../types/you-view';

interface AddTaskFormProps {
  selectedDate?: Date;
  onAddTask: (task: Omit<Task, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
}

const EMOJI_OPTIONS = ['📅', '✅', '💪', '📝', '🎯', '⭐', '🔥', '💼', '🏃', '📚', '🎨', '💡'];

export function AddTaskForm({ selectedDate, onAddTask, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskDate, setTaskDate] = useState<Date>(selectedDate || new Date());
  const [taskTime, setTaskTime] = useState('09:00');
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'custom'>('none');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatEndDate, setRepeatEndDate] = useState<Date | undefined>();
  const [reminder, setReminder] = useState(false);
  const [emoji, setEmoji] = useState('📅');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Combine date and time
      const [hours, minutes] = taskTime.split(':').map(Number);
      const combinedDate = new Date(taskDate);
      combinedDate.setHours(hours, minutes, 0, 0);

      const task: Omit<Task, 'id' | 'user_id' | 'created_at'> = {
        title: title.trim(),
        description: description.trim() || null,
        task_date: combinedDate.toISOString(),
        repeat_type: repeatType,
        repeat_interval: repeatType === 'custom' ? repeatInterval : 1,
        repeat_end_date: repeatEndDate?.toISOString() || null,
        reminder,
        completed: false,
        emoji,
        linked_journal_id: null,
        linked_goal_id: linkedGoalId || null,
        sort_order: 0,
      };

      await onAddTask(task);

      // Reset form
      setTitle('');
      setDescription('');
      setTaskDate(selectedDate || new Date());
      setTaskTime('09:00');
      setRepeatType('none');
      setRepeatInterval(1);
      setRepeatEndDate(undefined);
      setReminder(false);
      setEmoji('📅');
      setLinkedGoalId('');
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Task
            </CardTitle>
            <CardDescription>
              Schedule a task with optional repeats and reminders
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning journal reflection"
                required
                className="text-base"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes or details..."
                rows={3}
                className="text-base resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(taskDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={taskDate}
                    onSelect={(date) => date && setTaskDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <div className="flex gap-2 flex-wrap">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                      emoji === e ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repeat">Repeat</Label>
              <Select value={repeatType} onValueChange={(value: any) => setRepeatType(value)}>
                <SelectTrigger id="repeat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Never</SelectItem>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekly">Every week</SelectItem>
                  <SelectItem value="monthly">Every month</SelectItem>
                  <SelectItem value="custom">Custom interval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {repeatType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="interval">Repeat every (days)</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  value={repeatInterval}
                  onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                  className="text-base"
                />
              </div>
            )}

            {repeatType !== 'none' && (
              <div className="space-y-2 md:col-span-2">
                <Label>End repeat (optional - leave empty for forever)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {repeatEndDate ? format(repeatEndDate, 'PPP') : 'Never ends'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={repeatEndDate}
                      onSelect={setRepeatEndDate}
                      initialFocus
                      disabled={(date) => date < taskDate}
                    />
                  </PopoverContent>
                </Popover>
                {repeatEndDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRepeatEndDate(undefined)}
                  >
                    Clear end date (repeat forever)
                  </Button>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2 md:col-span-2">
              <Switch id="reminder" checked={reminder} onCheckedChange={setReminder} />
              <Label htmlFor="reminder" className="cursor-pointer">
                Enable reminder notifications
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-700">
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
