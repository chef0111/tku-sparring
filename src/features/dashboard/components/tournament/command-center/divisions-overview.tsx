import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Layers, LayoutGrid } from 'lucide-react';
import type { DivisionData } from '@/contracts/tournament/division';
import type { MatchData } from '@/contracts/tournament/match';
import {
  HubMetricCard,
  HubMetricFooter,
  HubSection,
  HubSectionContent,
} from '@/features/dashboard/components/home/hub-panel';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { countActionableMatchesByGroupId } from '@/lib/tournament/bracket/bracket-action-queue';

interface DivisionsOverviewProps {
  divisions: Array<DivisionData>;
  matches: Array<MatchData>;
  tournamentId: string;
}

export function DivisionsOverview({
  divisions,
  matches,
  tournamentId,
}: DivisionsOverviewProps) {
  const actionableMatchCountByDivisionId = React.useMemo(
    () => countActionableMatchesByGroupId(divisions, matches),
    [divisions, matches]
  );

  return (
    <HubSection
      title="Divisions"
      description="Divisions and arena assignments for this tournament"
      className="bg-transparent p-0"
    >
      {divisions.length === 0 ? (
        <HubSectionContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutGrid aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No divisions yet</EmptyTitle>
              <EmptyDescription>
                Create divisions in the Builder to organize athletes and
                brackets.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" asChild>
                <Link
                  to="/dashboard/tournaments/$id/builder"
                  params={{ id: tournamentId }}
                >
                  Open Builder
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        </HubSectionContent>
      ) : (
        <HubSectionContent className="grid items-stretch gap-4 p-0 sm:grid-cols-2">
          {divisions.map((division) => {
            const matchCount =
              actionableMatchCountByDivisionId.get(division.id) ?? 0;

            return (
              <HubMetricCard
                key={division.id}
                label={
                  <Link
                    to="/dashboard/tournaments/$id/builder"
                    params={{ id: tournamentId }}
                    search={{ division: division.id, tab: 'brackets' }}
                    className="hover:text-primary truncate transition-colors"
                  >
                    {division.name}
                  </Link>
                }
                icon={Layers}
                value={division._count.tournamentAthletes}
                footer={
                  <HubMetricFooter
                    status={matchCount > 0 ? 'online' : 'degraded'}
                    value={String(matchCount)}
                    label={
                      matchCount === 1 ? 'match scheduled' : 'matches scheduled'
                    }
                  />
                }
                action={
                  <span className="text-muted-foreground my-auto px-1 text-xs font-medium">
                    Arena {division.arenaIndex}
                  </span>
                }
              />
            );
          })}
        </HubSectionContent>
      )}
    </HubSection>
  );
}
