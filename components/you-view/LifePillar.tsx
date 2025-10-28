import { useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';

interface LifePillarProps {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: (id: string, collapsed: boolean) => void;
  isDraggable?: boolean;
}

export function LifePillar({
  id,
  icon,
  title,
  subtitle,
  children,
  collapsed = false,
  onToggle,
  isDraggable = true,
}: LifePillarProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onToggle?.(id, newCollapsed);
  };

  return (
    <Card
      className="relative transition-all duration-300 border-2"
      style={{
        borderColor: 'var(--color-accent)',
        background: 'var(--bg-secondary)',
      }}
    >
      <CardHeader
        className="cursor-pointer hover:opacity-80 transition-opacity pb-3"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-4">
          <div
            className="text-4xl flex-shrink-0"
            style={{ color: 'var(--color-primary)' }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h3>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </p>
          </div>
          <button
            className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <ChevronDown className="h-6 w-6" style={{ color: 'var(--text-secondary)' }} />
            ) : (
              <ChevronUp className="h-6 w-6" style={{ color: 'var(--text-secondary)' }} />
            )}
          </button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0">
          <div className="space-y-4">{children}</div>
        </CardContent>
      )}
    </Card>
  );
}
