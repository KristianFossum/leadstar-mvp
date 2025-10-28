import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { GripVertical } from 'lucide-react';

interface LifePillarConfig {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

interface PillarReorderProps {
  pillars: LifePillarConfig[];
  onReorder: (pillars: LifePillarConfig[]) => void;
}

interface SortableItemProps {
  pillar: LifePillarConfig;
}

function SortableItem({ pillar }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pillar.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 rounded-lg border cursor-move"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
      <span className="text-3xl">{pillar.icon}</span>
      <div className="flex-1">
        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {pillar.title}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {pillar.subtitle}
        </div>
      </div>
    </div>
  );
}

export function PillarReorder({ pillars, onReorder }: PillarReorderProps) {
  const [items, setItems] = useState(pillars);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        onReorder(reordered);
        return reordered;
      });
    }
  };

  return (
    <Card className="border-2" style={{ borderColor: 'var(--color-accent)', background: 'var(--bg-secondary)' }}>
      <CardHeader>
        <CardTitle style={{ color: 'var(--text-primary)' }}>🔄 Reorder Pillars</CardTitle>
        <CardDescription style={{ color: 'var(--text-secondary)' }}>
          Drag and drop to customize your pillar order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((pillar) => (
                <SortableItem key={pillar.id} pillar={pillar} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}
