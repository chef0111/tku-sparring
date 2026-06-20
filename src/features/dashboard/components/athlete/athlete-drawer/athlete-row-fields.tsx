import { IconX } from '@tabler/icons-react';
import type { AthleteRow } from '@/features/dashboard/types';
import { NumberInput } from '@/components/input/number-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BELT_LEVELS, GENDER_OPTIONS } from '@/config/athlete';
import { cn } from '@/lib/utils';

interface AthleteRowFieldsProps {
  row: AthleteRow;
  index: number;
  readOnly: boolean;
  rowCount: number;
  onUpdate: (
    index: number,
    field: keyof Omit<AthleteRow, 'id'>,
    value: string | number
  ) => void;
  onRemove: (index: number) => void;
}

export function AthleteRowFields({
  row,
  index,
  readOnly,
  rowCount,
  onUpdate,
  onRemove,
}: AthleteRowFieldsProps) {
  const showRemoveColumn = rowCount > 1;

  return (
    <div
      className={cn(
        'grid min-w-0 flex-1 items-center gap-2',
        showRemoveColumn
          ? 'grid-cols-[7.5rem_10rem_6.25rem_8rem_5.25rem_minmax(0,1fr)_minmax(0,1fr)_auto]'
          : 'grid-cols-[7.5rem_10rem_6.25rem_8rem_5.25rem_minmax(0,1fr)_minmax(0,1fr)]'
      )}
    >
      <Input
        className="w-full min-w-0"
        placeholder="Athlete ID"
        value={row.athleteCode}
        disabled={readOnly}
        onChange={(e) => onUpdate(index, 'athleteCode', e.target.value)}
      />

      <Input
        className="w-full min-w-0"
        placeholder="Athlete full name"
        value={row.name}
        disabled={readOnly}
        onChange={(e) => onUpdate(index, 'name', e.target.value)}
      />

      <Select
        value={row.gender}
        disabled={readOnly}
        onValueChange={(v) => onUpdate(index, 'gender', v as 'M' | 'F')}
      >
        <SelectTrigger className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GENDER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(row.beltLevel)}
        disabled={readOnly}
        onValueChange={(v) => onUpdate(index, 'beltLevel', Number(v))}
      >
        <SelectTrigger className="w-full min-w-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BELT_LEVELS.map((belt) => (
            <SelectItem key={belt.value} value={String(belt.value)}>
              {belt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <NumberInput
        className="w-full min-w-0"
        placeholder="kg"
        min={20}
        max={150}
        disabled={readOnly}
        disableIncrement={row.weight >= 150}
        disableDecrement={row.weight <= 20}
        value={row.weight}
        onChange={(e) => onUpdate(index, 'weight', Number(e.target.value))}
        handleIncrement={() => onUpdate(index, 'weight', row.weight + 1)}
        handleDecrement={() => onUpdate(index, 'weight', row.weight - 1)}
      />

      <Input
        className="w-full min-w-0"
        placeholder="Affiliation"
        value={row.affiliation}
        disabled={readOnly}
        onChange={(e) => onUpdate(index, 'affiliation', e.target.value)}
      />

      <Input
        className="w-full min-w-0"
        placeholder="Photo URL"
        title={row.image}
        value={row.image}
        disabled={readOnly}
        onChange={(e) => onUpdate(index, 'image', e.target.value)}
      />

      {showRemoveColumn &&
        (readOnly ? (
          <div className="size-8 shrink-0" aria-hidden />
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            className="shrink-0"
            onClick={() => onRemove(index)}
          >
            <IconX />
          </Button>
        ))}
    </div>
  );
}
