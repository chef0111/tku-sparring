import { Link } from '@tanstack/react-router';
import { ArrowRight, UserX, Users } from 'lucide-react';
import { AddAthleteProfileRow } from './add-athlete-profile-row';
import type { AddAthletesSheetState } from '@/features/dashboard/hooks/use-add-athletes-sheet';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

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
        <EmptyAthleteLibrary />
      ) : total === 0 ? (
        <NoAthletesFound
          allInTournament={allInTournament}
          hasFilters={hasFilters}
        />
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

function EmptyAthleteLibrary() {
  return (
    <Empty className="gap-2 p-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>No athletes in your library yet.</EmptyTitle>
        <EmptyDescription>
          Add athletes to your library to get started.
        </EmptyDescription>
        <EmptyContent>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/athletes">
              Go to Athletes
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </EmptyContent>
      </EmptyHeader>
    </Empty>
  );
}

function NoAthletesFound({
  allInTournament,
  hasFilters,
}: {
  allInTournament: boolean;
  hasFilters: boolean;
}) {
  return (
    <Empty className="gap-2 p-8">
      <EmptyMedia variant="icon">
        <UserX />
      </EmptyMedia>
      <EmptyTitle>No results found</EmptyTitle>
      <EmptyDescription>
        {allInTournament
          ? 'Everyone in your library is already in this tournament.'
          : hasFilters
            ? 'No athletes match for your filters.'
            : 'No athletes available to add.'}
      </EmptyDescription>
    </Empty>
  );
}
