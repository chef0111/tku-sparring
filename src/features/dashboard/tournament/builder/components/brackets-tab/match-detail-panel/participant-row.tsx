import { Crown } from 'lucide-react';
import type { TournamentAthleteData } from '@/features/dashboard/types';
import { cn } from '@/lib/utils';

export function ParticipantRow({
  label: _label,
  athlete,
  isWinner,
  dotClassName,
}: {
  label: string;
  athlete: TournamentAthleteData | undefined | null;
  isWinner: boolean;
  dotClassName: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border p-2.5',
        isWinner && 'border-primary/25 bg-primary/5'
      )}
    >
      <div className={cn('size-2 shrink-0 rounded-full', dotClassName)} />
      <div className="min-w-0 flex-1">
        {athlete ? (
          <>
            <p className="truncate text-sm font-medium">{athlete.name}</p>
            <p className="text-muted-foreground text-xs">
              {athlete.affiliation}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm italic">EMPTY</p>
        )}
      </div>
      {isWinner && (
        <Crown className="text-primary mr-1 size-5 shrink-0" aria-hidden />
      )}
    </div>
  );
}
