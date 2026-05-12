import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PoolGenderSelectProps {
  value: 'M' | 'F' | null | undefined;
  onChange: (gender: 'M' | 'F' | null) => void;
}

export function PoolGenderSelect({ value, onChange }: PoolGenderSelectProps) {
  return (
    <Select
      value={value ?? 'all'}
      onValueChange={(v) => onChange(v === 'all' ? null : (v as 'M' | 'F'))}
    >
      <SelectTrigger className="h-8! max-w-24! flex-1 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-w-24! min-w-24!">
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="M">Male</SelectItem>
        <SelectItem value="F">Female</SelectItem>
      </SelectContent>
    </Select>
  );
}
