import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { GripVertical, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '../../types/you-view';

interface SortableTaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function SortableTaskItem({ task, onToggleComplete, onEdit, onDelete }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const taskDate = parseISO(task.task_date);
  const dateLabel = isToday(taskDate) ? 'Today' : isTomorrow(taskDate) ? 'Tomorrow' : format(taskDate, 'MMM d');
  const timeLabel = format(taskDate, 'h:mm a');
  const overdue = isPast(taskDate) && !task.completed && !isToday(taskDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
        task.completed
          ? 'bg-green-50 border-green-200 opacity-75'
          : overdue
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
      }`}
    >
      <div
        className="cursor-grab active:cursor-grabbing pt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <Checkbox
        checked={task.completed}
        onCheckedChange={(checked) => onToggleComplete(task.id, checked as boolean)}
        className="mt-1"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{task.emoji}</span>
            <h4
              className={`font-semibold text-base ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
            >
              {task.title}
            </h4>
            {overdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
            {task.repeat_type !== 'none' && (
              <Badge variant="secondary" className="text-xs">
                🔄 {task.repeat_type}
              </Badge>
            )}
            {task.reminder && (
              <Badge variant="outline" className="text-xs">
                🔔
              </Badge>
            )}
          </div>
        </div>

        {task.description && (
          <p className={`text-sm mb-2 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>
              {dateLabel} at {timeLabel}
            </span>
          </div>
          {task.linked_goal_id && (
            <Badge variant="outline" className="text-xs">
              🎯 Linked to goal
            </Badge>
          )}
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(task)}
          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onReorder: (tasks: Task[]) => void;
}

export function TaskList({ tasks, onToggleComplete, onEdit, onDelete, onReorder }: TaskListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(tasks, oldIndex, newIndex);
      onReorder(reordered);
      toast.success('Task order updated!');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Sort by date, then by sort_order
    const dateA = new Date(a.task_date).getTime();
    const dateB = new Date(b.task_date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.sort_order - b.sort_order;
  });

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const todayTasks = activeTasks.filter((t) => isToday(parseISO(t.task_date)));
  const overdueTasks = activeTasks.filter((t) => isPast(parseISO(t.task_date)) && !isToday(parseISO(t.task_date)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              ✅ Your Tasks
            </CardTitle>
            <CardDescription>
              {todayTasks.length} tasks for today
              {overdueTasks.length > 0 && ` • ${overdueTasks.length} overdue`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({tasks.length})
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('active')}
            >
              Active ({activeTasks.length})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Done ({completedTasks.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No tasks yet!</p>
            <p className="text-sm">
              {filter === 'completed'
                ? 'Complete some tasks to see them here.'
                : 'Click a date on the calendar to add your first task.'}
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {sortedTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
