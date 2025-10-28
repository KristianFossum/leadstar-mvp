import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import type { JournalEntry } from '../../types/dashboard';
import { format } from 'date-fns';

interface DailyJournalProps {
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, 'id'>) => void;
}

const moodOptions = [
  { value: 'excellent', label: 'Excellent 🚀', color: 'bg-green-500' },
  { value: 'good', label: 'Good 😊', color: 'bg-blue-500' },
  { value: 'neutral', label: 'Neutral 😐', color: 'bg-gray-500' },
  { value: 'challenging', label: 'Challenging 😓', color: 'bg-yellow-500' },
  { value: 'difficult', label: 'Difficult 😰', color: 'bg-red-500' },
] as const;

export function DailyJournal({ entries, onAddEntry }: DailyJournalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [wins, setWins] = useState('');
  const [struggles, setStruggles] = useState('');
  const [mood, setMood] = useState<JournalEntry['mood']>('good');

  const handleSubmit = () => {
    const winsArray = wins.split('\n').filter(w => w.trim());
    const strugglesArray = struggles.split('\n').filter(s => s.trim());

    onAddEntry({
      date: new Date(),
      wins: winsArray,
      struggles: strugglesArray,
      mood,
    });

    setWins('');
    setStruggles('');
    setMood('good');
    setIsAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Journal</CardTitle>
        <CardDescription>Track your wins, struggles, and mood</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAdding ? (
          <>
            {entries.length > 0 && (
              <div className="space-y-4 mb-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {format(entry.date, 'MMMM dd, yyyy')}
                      </span>
                      <Badge
                        className={
                          moodOptions.find((m) => m.value === entry.mood)?.color
                        }
                      >
                        {moodOptions.find((m) => m.value === entry.mood)?.label}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-1">Wins 🎉</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {entry.wins.map((win, idx) => (
                          <li key={idx} className="text-sm">{win}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-1">Struggles 💭</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {entry.struggles.map((struggle, idx) => (
                          <li key={idx} className="text-sm">{struggle}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={() => setIsAdding(true)} className="w-full">
              Add Today's Entry
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Today's Wins (one per line)
              </label>
              <Textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="What went well today?"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Today's Struggles (one per line)
              </label>
              <Textarea
                value={struggles}
                onChange={(e) => setStruggles(e.target.value)}
                placeholder="What was challenging?"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((option) => (
                  <Badge
                    key={option.value}
                    className={`cursor-pointer ${
                      mood === option.value ? option.color : 'bg-secondary'
                    }`}
                    onClick={() => setMood(option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1">
                Save Entry
              </Button>
              <Button
                onClick={() => setIsAdding(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
