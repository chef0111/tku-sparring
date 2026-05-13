import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ScoreControl({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled || value <= 0}
        >
          <Minus />
        </Button>
        <span className="w-8 text-center text-xl font-semibold tabular-nums">
          {value}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(Math.min(2, value + 1))}
          disabled={disabled || value >= 2}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
