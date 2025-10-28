import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';

interface ValuesEditorProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  personalityType?: string;
}

export function ValuesEditor({ values, onValuesChange, personalityType }: ValuesEditorProps) {
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddValue = () => {
    if (!newValue.trim()) return;

    if (values.includes(newValue.trim())) {
      toast.error('This value already exists');
      return;
    }

    onValuesChange([...values, newValue.trim()]);
    setNewValue('');
    setIsAdding(false);
    toast.success('Value added! 🌟');
  };

  const handleRemoveValue = (valueToRemove: string) => {
    onValuesChange(values.filter(v => v !== valueToRemove));
    toast.success('Value removed');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddValue();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewValue('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Core Values
        </h4>
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge
              key={value}
              className="px-3 py-1.5 text-sm flex items-center gap-2 border-0"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
              }}
            >
              {value}
              <button
                onClick={() => handleRemoveValue(value)}
                className="hover:opacity-70 transition-opacity"
                aria-label={`Remove ${value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {isAdding ? (
            <div className="flex items-center gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter value..."
                className="h-8 w-32 text-sm"
                autoFocus
                style={{
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--color-accent)',
                }}
              />
              <Button
                size="sm"
                onClick={handleAddValue}
                className="h-8 px-3"
                style={{
                  background: 'var(--color-accent)',
                  color: 'white',
                }}
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewValue('');
                }}
                className="h-8 px-3"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAdding(true)}
              className="h-8 px-3 gap-1"
              style={{
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
              }}
            >
              <Plus className="h-3 w-3" />
              Add Value
            </Button>
          )}
        </div>
      </div>

      {personalityType && (
        <div
          className="p-4 rounded-lg"
          style={{
            background: 'var(--bg-primary)',
          }}
        >
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            Leadership Style
          </h4>
          <Badge
            className="text-lg px-4 py-2 border-0"
            style={{
              background: 'var(--color-secondary)',
              color: 'white',
            }}
          >
            {personalityType}
          </Badge>
        </div>
      )}
    </div>
  );
}
