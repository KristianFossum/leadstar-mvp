import { useState, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { Task } from '../../types/you-view';

const locales = {
  'en-US': undefined,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarProps {
  tasks: Task[];
  onDateSelect: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

export function Calendar({ tasks, onDateSelect, onTaskClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Convert tasks to calendar events
  const events = useMemo(() => {
    return tasks.map(task => ({
      id: task.id,
      title: `${task.emoji} ${task.title}`,
      start: new Date(task.task_date),
      end: new Date(task.task_date),
      resource: task,
    }));
  }, [tasks]);

  // Get task counts per day for badge display
  const taskCountsByDate = useMemo(() => {
    const counts: { [key: string]: number } = {};
    tasks.forEach(task => {
      const dateKey = format(new Date(task.task_date), 'yyyy-MM-dd');
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  const handleSelectSlot = ({ start }: { start: Date }) => {
    onDateSelect(start);
  };

  const handleSelectEvent = (event: any) => {
    onTaskClick(event.resource);
  };

  const customDayPropGetter = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const taskCount = taskCountsByDate[dateKey];
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

    return {
      className: `${taskCount ? 'has-tasks' : ''} ${isToday ? 'today' : ''}`,
      style: {
        backgroundColor: isToday ? '#dbeafe' : undefined,
      },
    };
  };

  const customEventPropGetter = (event: any) => {
    const task = event.resource as Task;
    return {
      style: {
        backgroundColor: task.completed ? '#10b981' : '#8b5cf6',
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '0.875rem',
        opacity: task.completed ? 0.7 : 1,
      },
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📅 Your Schedule
            </CardTitle>
            <CardDescription>
              Click a date to add tasks, or click existing tasks to edit
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {tasks.filter(t => !t.completed).length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="calendar-wrapper" style={{ height: '500px' }}>
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            dayPropGetter={customDayPropGetter}
            eventPropGetter={customEventPropGetter}
            views={['month']}
            defaultView="month"
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            style={{ height: '100%' }}
            popup
          />
        </div>
        <style>{`
          .calendar-wrapper .rbc-calendar {
            font-family: inherit;
          }
          .calendar-wrapper .rbc-header {
            padding: 8px;
            font-weight: 600;
            color: #6b7280;
            border-bottom: 2px solid #e5e7eb;
          }
          .calendar-wrapper .rbc-today {
            background-color: #dbeafe !important;
          }
          .calendar-wrapper .rbc-date-cell {
            padding: 4px;
            text-align: right;
          }
          .calendar-wrapper .rbc-date-cell.rbc-now {
            font-weight: bold;
            color: #2563eb;
          }
          .calendar-wrapper .rbc-event {
            padding: 2px 4px;
            cursor: pointer;
          }
          .calendar-wrapper .rbc-event:hover {
            opacity: 0.8;
          }
          .calendar-wrapper .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid #f3f4f6;
          }
          .calendar-wrapper .rbc-toolbar {
            padding: 12px 0;
            font-size: 1rem;
          }
          .calendar-wrapper .rbc-toolbar button {
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            background: white;
            color: #374151;
            font-weight: 500;
          }
          .calendar-wrapper .rbc-toolbar button:hover {
            background: #f3f4f6;
          }
          .calendar-wrapper .rbc-toolbar button.rbc-active {
            background: #8b5cf6;
            color: white;
            border-color: #8b5cf6;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
