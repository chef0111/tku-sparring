import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BELT_LEVELS, getBeltLabel } from '@/config/athlete';
import { Label } from '@/components/ui/label';

export interface PoolBeltFilterPatch {
  poolBeltMin?: number | null;
  poolBeltMax?: number | null;
}

interface PoolBeltFilterProps {
  poolBeltMin: number | null | undefined;
  poolBeltMax: number | null | undefined;
  onPatch: (patch: PoolBeltFilterPatch) => void;
}

export function PoolBeltFilter({
  poolBeltMin,
  poolBeltMax,
  onPatch,
}: PoolBeltFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-12 border-dashed px-2 text-xs"
        >
          Belt
          {(poolBeltMin != null || poolBeltMax != null) && (
            <Badge
              variant="secondary"
              className="mx-0 max-w-28 truncate px-1 text-[10px]"
              title={
                poolBeltMin != null && poolBeltMax != null
                  ? `${getBeltLabel(poolBeltMin)} – ${getBeltLabel(poolBeltMax)}`
                  : poolBeltMin != null
                    ? `≥ ${getBeltLabel(poolBeltMin)}`
                    : `≤ ${getBeltLabel(poolBeltMax!)}`
              }
            >
              {poolBeltMin != null && poolBeltMax != null
                ? `${poolBeltMin}–${poolBeltMax}`
                : poolBeltMin != null
                  ? `≥${poolBeltMin}`
                  : `≤${poolBeltMax}`}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium">Belt range</p>
          <div className="flex gap-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs font-medium">
                Min
              </Label>
              <Select
                value={poolBeltMin == null ? 'any' : String(poolBeltMin)}
                onValueChange={(v) => {
                  const nextMin = v === 'any' ? null : Number(v);
                  onPatch({
                    poolBeltMin: nextMin,
                    poolBeltMax:
                      nextMin != null &&
                      poolBeltMax != null &&
                      poolBeltMax < nextMin
                        ? nextMin
                        : poolBeltMax,
                  });
                }}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="min-w-28">
                  <SelectItem value="any">Any</SelectItem>
                  {BELT_LEVELS.map((b) => (
                    <SelectItem key={b.value} value={String(b.value)}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs font-medium">
                Max
              </Label>
              <Select
                value={poolBeltMax == null ? 'any' : String(poolBeltMax)}
                onValueChange={(v) => {
                  const nextMax = v === 'any' ? null : Number(v);
                  onPatch({
                    poolBeltMax: nextMax,
                    poolBeltMin:
                      nextMax != null &&
                      poolBeltMin != null &&
                      poolBeltMin > nextMax
                        ? nextMax
                        : poolBeltMin,
                  });
                }}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="min-w-28">
                  <SelectItem value="any">Any</SelectItem>
                  {BELT_LEVELS.map((b) => (
                    <SelectItem key={b.value} value={String(b.value)}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
