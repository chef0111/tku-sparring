import { Link } from '@tanstack/react-router';
import { UserPlus, Users } from 'lucide-react';
import { AddAthleteProfileRow } from './add-athlete-profile-row';
import type { AddAthletesSheetState } from '@/features/dashboard/tournament/builder/hooks/use-add-athletes-sheet';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

function AthletesLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center justify-center p-8',
        className
      )}
    >
      <Spinner />
    </div>
  );
}

interface AddAthletesListProps {
  list: AddAthletesSheetState['list'];
  virtual: AddAthletesSheetState['virtual'];
  selectedIds: Set<string>;
  onToggleProfile: (id: string) => void;
}

export function AddAthletesList({
  list,
  virtual,
  selectedIds,
  onToggleProfile,
}: AddAthletesListProps) {
  const { scrollRef, rowVirtualizer, virtualItems } = virtual;
  const { isPending, items, total, hasFilters, emptyLibrary, allInTournament } =
    list;

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto rounded-md border"
    >
      {isPending ? (
        <AthletesLoading />
      ) : emptyLibrary ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 p-8 text-center text-sm">
          <Users className="size-8 opacity-50" aria-hidden="true" />
          <p>No athletes in your library yet.</p>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            asChild
          >
            <Link to="/dashboard/athletes">Go to Athletes</Link>
          </Button>
        </div>
      ) : total === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 p-8 text-center text-sm">
          <UserPlus className="size-8 opacity-50" aria-hidden="true" />
          <p>
            {allInTournament
              ? 'Everyone in your library is already in this tournament.'
              : hasFilters
                ? 'No athletes match for your filters.'
                : 'No athletes available to add.'}
          </p>
        </div>
      ) : (
        <div
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {virtualItems.map((virtualRow) => {
            const profile = items[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="absolute top-0 left-0 w-full border-b"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                {profile ? (
                  <AddAthleteProfileRow
                    profile={profile}
                    checked={selectedIds.has(profile.id)}
                    onToggle={() => onToggleProfile(profile.id)}
                  />
                ) : (
                  <AthletesLoading className="h-15 p-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
