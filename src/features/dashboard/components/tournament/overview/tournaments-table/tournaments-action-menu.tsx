import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  CircleDot,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Row } from '@tanstack/react-table';

import type {
  TournamentListItem,
  TournamentStatus,
} from '@/contracts/tournament/list';
import type { TournamentRowActionOptions } from '@/features/dashboard/lib/tournament/row-action-options';
import {
  TOURNAMENT_STATUS_LABEL,
  forceSetTournamentStatus,
  isBackwardStatusTransition,
  tournamentStatusRiskNotes,
} from '@/lib/tournament/tournament-status';
import { TOURNAMENT_STATUSES } from '@/contracts/tournament/list';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSetTournamentStatus } from '@/queries/tournament';

interface TournamentsActionMenuProps {
  options: TournamentRowActionOptions;
  row: Row<TournamentListItem>;
  tournament: TournamentListItem;
}

export function TournamentsActionMenu({
  options,
  row,
  tournament,
}: TournamentsActionMenuProps) {
  const navigate = useNavigate();
  const [isUpdatePending, startUpdateTransition] = React.useTransition();
  const setStatusMutation = useSetTournamentStatus({ suppressToast: true });

  const isUpdating = isUpdatePending || setStatusMutation.isPending;

  const stopRowClick = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onStatusChange = React.useCallback(
    (status: TournamentStatus) => {
      const from = tournament.status;
      if (status === from) return;

      if (isBackwardStatusTransition(from, status)) {
        toast.warning(`Reverting to ${TOURNAMENT_STATUS_LABEL[status]}`, {
          description: tournamentStatusRiskNotes(from, status).join(' '),
        });
      }

      const force = forceSetTournamentStatus(from, status);

      startUpdateTransition(() => {
        toast.promise(
          setStatusMutation.mutateAsync({
            id: tournament.id,
            status,
            force,
          }),
          {
            loading: 'Updating status…',
            success: `Status set to ${TOURNAMENT_STATUS_LABEL[status]}`,
            error: (err) =>
              err instanceof Error ? err.message : 'Status update failed',
          }
        );
      });
    },
    [tournament.id, tournament.status, setStatusMutation, startUpdateTransition]
  );

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild onClick={stopRowClick}>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 lg:absolute lg:top-2 lg:right-2"
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open tournament menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem
          onClick={() =>
            navigate({
              to: '/dashboard/tournaments/$id',
              params: { id: row.original.id },
            })
          }
        >
          <ExternalLink className="mr-2 size-4" />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => options.onRowAction({ row, variant: 'update' })}
        >
          <Pencil className="mr-2 size-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isUpdating}>
            <CircleDot className="mr-2 size-4" />
            Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel className="text-center">
              Choose status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={tournament.status}
              onValueChange={(value) => {
                if (!TOURNAMENT_STATUSES.includes(value as TournamentStatus)) {
                  return;
                }
                onStatusChange(value as TournamentStatus);
              }}
            >
              {TOURNAMENT_STATUSES.map((status) => (
                <DropdownMenuRadioItem
                  key={status}
                  value={status}
                  disabled={isUpdating}
                  className="min-w-32"
                >
                  {TOURNAMENT_STATUS_LABEL[status]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => options.onRowAction({ row, variant: 'delete' })}
        >
          <Trash2 className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
