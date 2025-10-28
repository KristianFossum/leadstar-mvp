import { addDays, addWeeks, addMonths, isBefore, parseISO } from 'date-fns';
import type { Task } from '../types/you-view';

export interface GeneratedTask extends Omit<Task, 'id' | 'user_id' | 'created_at'> {
  parent_task_id?: string;
}

/**
 * Generate future task instances for a repeating task
 * @param task The original repeating task
 * @param maxInstances Maximum number of future instances to generate (default: 30)
 * @returns Array of generated task instances
 */
export function generateRepeatingTasks(
  task: Omit<Task, 'id' | 'user_id' | 'created_at'>,
  maxInstances: number = 30
): GeneratedTask[] {
  if (task.repeat_type === 'none') {
    return [];
  }

  const generatedTasks: GeneratedTask[] = [];
  let currentDate = parseISO(task.task_date);
  const endDate = task.repeat_end_date ? parseISO(task.repeat_end_date) : null;

  // Generate future instances
  for (let i = 0; i < maxInstances; i++) {
    let nextDate: Date;

    switch (task.repeat_type) {
      case 'daily':
        nextDate = addDays(currentDate, task.repeat_interval || 1);
        break;
      case 'weekly':
        nextDate = addWeeks(currentDate, task.repeat_interval || 1);
        break;
      case 'monthly':
        nextDate = addMonths(currentDate, task.repeat_interval || 1);
        break;
      case 'custom':
        nextDate = addDays(currentDate, task.repeat_interval || 1);
        break;
      default:
        return generatedTasks;
    }

    // Stop if we've reached the end date
    if (endDate && !isBefore(nextDate, endDate)) {
      break;
    }

    // Create a new task instance
    generatedTasks.push({
      ...task,
      task_date: nextDate.toISOString(),
      completed: false, // New instances start as incomplete
    });

    currentDate = nextDate;
  }

  return generatedTasks;
}

/**
 * Check if more task instances need to be generated
 * (e.g., if the last instance is approaching)
 * @param tasks Existing tasks for a repeating task
 * @param daysAhead How many days ahead to check (default: 14)
 * @returns Whether more instances should be generated
 */
export function shouldGenerateMoreInstances(
  tasks: Task[],
  daysAhead: number = 14
): boolean {
  if (tasks.length === 0) return false;

  // Find the latest task instance
  const latestTask = tasks.reduce((latest, task) => {
    const taskDate = new Date(task.task_date);
    const latestDate = new Date(latest.task_date);
    return taskDate > latestDate ? task : latest;
  });

  const latestDate = new Date(latestTask.task_date);
  const threshold = addDays(new Date(), daysAhead);

  return isBefore(latestDate, threshold);
}

/**
 * Get the repeat description for display
 * @param task Task with repeat settings
 * @returns Human-readable repeat description
 */
export function getRepeatDescription(task: Task | Omit<Task, 'id' | 'user_id' | 'created_at'>): string {
  if (task.repeat_type === 'none') return 'Does not repeat';

  const interval = task.repeat_interval || 1;
  const endDate = task.repeat_end_date ? ` until ${new Date(task.repeat_end_date).toLocaleDateString()}` : ' (no end date)';

  switch (task.repeat_type) {
    case 'daily':
      return interval === 1 ? `Every day${endDate}` : `Every ${interval} days${endDate}`;
    case 'weekly':
      return interval === 1 ? `Every week${endDate}` : `Every ${interval} weeks${endDate}`;
    case 'monthly':
      return interval === 1 ? `Every month${endDate}` : `Every ${interval} months${endDate}`;
    case 'custom':
      return `Every ${interval} days${endDate}`;
    default:
      return 'Custom repeat';
  }
}

/**
 * Calculate sort order for tasks
 * @param tasks Array of tasks
 * @returns Tasks with updated sort_order
 */
export function updateTaskSortOrder(tasks: Task[]): Task[] {
  return tasks.map((task, index) => ({
    ...task,
    sort_order: index,
  }));
}
