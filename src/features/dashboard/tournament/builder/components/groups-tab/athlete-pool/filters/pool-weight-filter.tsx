import { NumberInput } from '@/components/input/number-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface PoolWeightFilterPatch {
  poolWeightMin?: number | null;
  poolWeightMax?: number | null;
}

interface PoolWeightFilterProps {
  poolWeightMin: number | null | undefined;
  poolWeightMax: number | null | undefined;
  onPatch: (patch: PoolWeightFilterPatch) => void;
}

export function PoolWeightFilter({
  poolWeightMin,
  poolWeightMax,
  onPatch,
}: PoolWeightFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-dashed px-2 text-xs"
        >
          Weight
          {(poolWeightMin != null || poolWeightMax != null) && (
            <Badge
              variant="secondary"
              className="max-w-24 truncate px-1 text-[10px]"
              title={
                poolWeightMin != null && poolWeightMax != null
                  ? `${poolWeightMin}–${poolWeightMax} kg`
                  : poolWeightMin != null
                    ? `≥ ${poolWeightMin} kg`
                    : `≤ ${poolWeightMax} kg`
              }
            >
              {poolWeightMin != null && poolWeightMax != null
                ? `${poolWeightMin}–${poolWeightMax}`
                : poolWeightMin != null
                  ? `≥${poolWeightMin}`
                  : `≤${poolWeightMax}`}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium">Weight range (kg)</p>
          <div className="flex items-center gap-2">
            <NumberInput
              min={0}
              max={300}
              step={1}
              placeholder="Min"
              value={poolWeightMin ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  onPatch({ poolWeightMin: null });
                  return;
                }
                const n = Math.round(Number(raw));
                if (!Number.isFinite(n)) return;
                const clamped = Math.min(300, Math.max(0, n));
                onPatch({
                  poolWeightMin: clamped,
                  poolWeightMax:
                    poolWeightMax != null && poolWeightMax < clamped
                      ? clamped
                      : poolWeightMax,
                });
              }}
              className="h-8 text-xs"
              handleIncrement={() => {
                const next = Math.min(300, (poolWeightMin ?? -1) + 1);
                onPatch({
                  poolWeightMin: next,
                  poolWeightMax:
                    poolWeightMax != null && poolWeightMax < next
                      ? next
                      : poolWeightMax,
                });
              }}
              handleDecrement={() => {
                if (poolWeightMin == null) return;
                const next = Math.max(0, poolWeightMin - 1);
                onPatch({ poolWeightMin: next });
              }}
              disableIncrement={(poolWeightMin ?? -1) >= 150}
              disableDecrement={poolWeightMin == null || poolWeightMin <= 0}
            />
            <span className="text-muted-foreground text-xs">–</span>
            <NumberInput
              min={0}
              max={150}
              step={1}
              placeholder="Max"
              value={poolWeightMax ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  onPatch({ poolWeightMax: null });
                  return;
                }
                const n = Math.round(Number(raw));
                if (!Number.isFinite(n)) return;
                const clamped = Math.min(150, Math.max(0, n));
                onPatch({
                  poolWeightMax: clamped,
                  poolWeightMin:
                    poolWeightMin != null && poolWeightMin > clamped
                      ? clamped
                      : poolWeightMin,
                });
              }}
              className="h-8 text-xs"
              handleIncrement={() => {
                if (poolWeightMax == null) {
                  onPatch({ poolWeightMax: 150 });
                  return;
                }
                const next = Math.min(150, poolWeightMax + 1);
                onPatch({
                  poolWeightMax: next,
                  poolWeightMin:
                    poolWeightMin != null && poolWeightMin > next
                      ? next
                      : poolWeightMin,
                });
              }}
              handleDecrement={() => {
                if (poolWeightMax == null) return;
                const next = Math.max(0, poolWeightMax - 1);
                onPatch({
                  poolWeightMax: next,
                  poolWeightMin:
                    poolWeightMin != null && poolWeightMin > next
                      ? next
                      : poolWeightMin,
                });
              }}
              disableIncrement={poolWeightMax != null && poolWeightMax >= 150}
              disableDecrement={poolWeightMax == null || poolWeightMax <= 0}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
