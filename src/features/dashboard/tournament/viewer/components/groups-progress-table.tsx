import { Link } from '@tanstack/react-router';
import { LayoutGrid } from 'lucide-react';
import { MatchProgressBar } from './match-progress-bar';
import type { GroupProgressRow } from '../lib/compute-command-center';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface GroupsProgressTableProps {
  rows: Array<GroupProgressRow>;
  tournamentId: string;
}

export function GroupsProgressTable({
  rows,
  tournamentId,
}: GroupsProgressTableProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-muted-foreground mb-4 text-xs font-medium tracking-wide uppercase">
          Groups
        </h2>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutGrid />
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
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <h2 className="text-muted-foreground mb-4 text-xs font-medium tracking-wide uppercase">
        Groups
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Group</TableHead>
            <TableHead>Arena</TableHead>
            <TableHead className="text-right">Athletes</TableHead>
            <TableHead className="text-right">Matches</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="w-[100px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.groupId} className="hover:bg-muted/50">
              <TableCell className="font-medium">{row.groupName}</TableCell>
              <TableCell className="tabular-nums">{row.arenaIndex}</TableCell>
              <TableCell className="text-right tabular-nums">
                {row.athleteCount}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.matchCount}
              </TableCell>
              <TableCell>
                <div className="flex min-w-[120px] flex-col gap-1">
                  <MatchProgressBar
                    pending={row.pending}
                    active={row.active}
                    complete={row.complete}
                    total={row.total}
                  />
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {row.complete}/{row.total}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    to="/dashboard/tournaments/$id/builder"
                    params={{ id: tournamentId }}
                  >
                    Builder
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
