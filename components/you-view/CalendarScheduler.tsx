import { useState, useEffect } from 'react';
import { Calendar } from './Calendar';
import { TaskList } from './TaskList';
import { AddTaskForm } from './AddTaskForm';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { generateRepeatingTasks, updateTaskSortOrder } from '../../utils/taskUtils';
import { awardXP, XP_REWARDS } from '../../lib/gamification';
import { triggerLevelUpConfetti, triggerBadgeUnlockConfetti } from '../../lib/confetti';
import type { Task } from '../../types/you-view';

export function CalendarScheduler() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load tasks from Supabase
  const loadTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('task_date', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      // Insert the main task
      const { data: insertedTask, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Generate repeating task instances if needed
      if (taskData.repeat_type !== 'none') {
        const repeatedTasks = generateRepeatingTasks(taskData, 30);

        if (repeatedTasks.length > 0) {
          const { error: repeatError } = await supabase
            .from('tasks')
            .insert(
              repeatedTasks.map((t) => ({
                ...t,
                user_id: user.id,
              }))
            );

          if (repeatError) throw repeatError;
        }
      }

      await loadTasks();
      toast.success('Task added! 🌟');
      setShowAddForm(false);
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed } : t))
      );

      // Award XP if completing task
      if (completed && user) {
        const xpResult = await awardXP(user.id, XP_REWARDS.TASK_COMPLETE, 'task');

        if (xpResult.success) {
          if (xpResult.leveledUp) {
            triggerLevelUpConfetti();
            toast.success(`Level ${xpResult.newLevel} Unlocked! Keep shining! 🎉`, {
              duration: 4000,
            });
          } else {
            toast.success(`Task completed! +${XP_REWARDS.TASK_COMPLETE} XP earned! ✅`);
          }

          // Show badge unlock toast if earned
          if (xpResult.unlockedBadge) {
            setTimeout(() => {
              triggerBadgeUnlockConfetti();
              toast.success(`🎖️ Badge Unlocked: ${xpResult.unlockedBadge!.emoji} ${xpResult.unlockedBadge!.name}`, {
                duration: 4000,
              });
            }, 500);
          }
        }
      } else if (!completed) {
        toast.success('Task reopened');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleReorderTasks = async (reorderedTasks: Task[]) => {
    const tasksWithOrder = updateTaskSortOrder(reorderedTasks);
    setTasks(tasksWithOrder);

    try {
      // Update sort_order in batch
      const updates = tasksWithOrder.map((task) => ({
        id: task.id,
        sort_order: task.sort_order,
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast.error('Failed to save task order');
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowAddForm(true);
    setEditingTask(null);
  };

  const handleTaskClick = (task: Task) => {
    // For now, just show task details. Can expand to edit form later
    toast.info(`Task: ${task.title}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-[500px] bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-[400px] bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAddForm && (
        <AddTaskForm
          selectedDate={selectedDate}
          onAddTask={handleAddTask}
          onCancel={() => {
            setShowAddForm(false);
            setSelectedDate(undefined);
          }}
        />
      )}

      <Calendar
        tasks={tasks}
        onDateSelect={handleDateSelect}
        onTaskClick={handleTaskClick}
      />

      <TaskList
        tasks={tasks}
        onToggleComplete={handleToggleComplete}
        onEdit={(task) => {
          setEditingTask(task);
          setShowAddForm(true);
        }}
        onDelete={handleDeleteTask}
        onReorder={handleReorderTasks}
      />
    </div>
  );
}
