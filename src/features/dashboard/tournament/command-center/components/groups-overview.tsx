import * as React from 'react';
import { Link } from '@tanstack/react-router';
import { Layers, LayoutGrid } from 'lucide-react';
import type { GroupData, MatchData } from '@/features/dashboard/types';
import {
  HubMetricCard,
  HubMetricFooter,
  HubSection,
  HubSectionContent,
} from '@/features/dashboard/home/components/hub-panel';
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

interface GroupsOverviewProps {
  groups: Array<GroupData>;
  matches: Array<MatchData>;
  tournamentId: string;
}

export function GroupsOverview({
  groups,
  matches,
  tournamentId,
}: GroupsOverviewProps) {
  const actionableMatchCountByGroupId = React.useMemo(
    () => countActionableMatchesByGroupId(groups, matches),
    [groups, matches]
  );

  return (
    <HubSection
      title="Groups"
      description="Divisions and arena assignments for this tournament"
      className="bg-transparent p-0"
    >
      {groups.length === 0 ? (
        <HubSectionContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutGrid aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No groups yet</EmptyTitle>
              <EmptyDescription>
                Create groups in the Builder to organize athletes and brackets.
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
          {groups.map((group) => {
            const matchCount = actionableMatchCountByGroupId.get(group.id) ?? 0;

            return (
              <HubMetricCard
                key={group.id}
                label={
                  <Link
                    to="/dashboard/tournaments/$id/builder"
                    params={{ id: tournamentId }}
                    search={{ group: group.id, tab: 'brackets' }}
                    className="hover:text-primary truncate transition-colors"
                  >
                    {group.name}
                  </Link>
                }
                icon={Layers}
                value={group._count.tournamentAthletes}
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
                    Arena {group.arenaIndex}
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
