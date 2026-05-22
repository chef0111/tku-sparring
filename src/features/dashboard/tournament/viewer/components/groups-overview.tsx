import { Link } from '@tanstack/react-router';
import { LayoutGrid } from 'lucide-react';
import type { GroupData } from '@/features/dashboard/types';
import {
  HubSection,
  HubSectionContent,
} from '@/features/dashboard/home/components/hub-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

interface GroupsOverviewProps {
  groups: Array<GroupData>;
  tournamentId: string;
}

export function GroupsOverview({ groups, tournamentId }: GroupsOverviewProps) {
  return (
    <HubSection
      title="Groups"
      description="Divisions and arena assignments for this tournament"
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
        <HubSectionContent className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="border-border/60 bg-muted/20 hover:bg-muted/40 flex flex-col gap-3 rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{group.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Arena {group.arenaIndex}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  A{group.arenaIndex}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Athletes</dt>
                  <dd className="font-medium tabular-nums">
                    {group._count.tournamentAthletes}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Matches</dt>
                  <dd className="font-medium tabular-nums">
                    {group._count.matches}
                  </dd>
                </div>
              </dl>
              <Button
                variant="outline"
                size="sm"
                className="mt-auto w-full cursor-pointer"
                asChild
              >
                <Link
                  to="/dashboard/tournaments/$id/builder"
                  params={{ id: tournamentId }}
                >
                  Open Builder
                </Link>
              </Button>
            </div>
          ))}
        </HubSectionContent>
      )}
    </HubSection>
  );
}
