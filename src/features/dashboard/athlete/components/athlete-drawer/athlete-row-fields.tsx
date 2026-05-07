import { IconX } from '@tabler/icons-react';
import type { AthleteRow } from '../../types/athlete';
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
  return (
    <>
      <Input
        className="max-w-42 min-w-36"
        placeholder="Athlete ID"
        value={row.athleteCode}
        disabled={readOnly}
        onChange={(e) => onUpdate(index, 'athleteCode', e.target.value)}
      />

      <Input
        className="max-w-64 min-w-36 flex-1"
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
        <SelectTrigger className="w-24">
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
        <SelectTrigger className="w-28">
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
        className="w-20"
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
        className="max-w-48 min-w-36"
        placeholder="Affiliation"
        value={row.affiliation}
        disabled={readOnly}
        onChange={(e) => onUpdate(index, 'affiliation', e.target.value)}
      />

      {rowCount > 1 &&
        (readOnly ? (
          <div className="size-8 shrink-0" aria-hidden />
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            onClick={() => onRemove(index)}
          >
            <IconX />
          </Button>
        ))}
    </>
  );
}
