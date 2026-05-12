import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PoolSearchInputProps {
  value: string | null | undefined;
  onChange: (q: string | null) => void;
}

export function PoolSearchInput({ value, onChange }: PoolSearchInputProps) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
      <Input
        placeholder="Search name or affiliation..."
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-8 pl-8 text-xs"
      />
    </div>
  );
}
