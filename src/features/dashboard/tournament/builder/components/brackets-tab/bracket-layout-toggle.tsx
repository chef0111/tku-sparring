import { ArrowRightFromLine, Columns2 } from 'lucide-react';

import type { BracketCanvasLayout } from '@/lib/tournament/bracket-layout';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type BracketLayoutToggleProps = {
  value: BracketCanvasLayout;
  onChange: (next: BracketCanvasLayout) => void;
};

export function BracketLayoutToggle({
  value,
  onChange,
}: BracketLayoutToggleProps) {
  return (
    <Card
      className="bg-popover absolute top-2.5 left-2.5 z-10 rounded-md border p-1 shadow-md ring-0"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        onValueChange={(next) => {
          if (next === 'two-sided' || next === 'one-sided') onChange(next);
        }}
        aria-label="Bracket canvas layout"
      >
        <ToggleGroupItem value="two-sided" aria-label="Two-sided layout">
          <Columns2 className="size-4" />
          <span className="sr-only">Two-sided layout</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="one-sided" aria-label="One-sided layout">
          <ArrowRightFromLine className="size-4" />
          <span className="sr-only">One-sided layout</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </Card>
  );
}
