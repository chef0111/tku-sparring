import { formatDistanceToNow } from 'date-fns';
import { TournamentStatusPill } from '../tournament-status-pill';
import { TournamentsActionMenu } from './tournaments-action-menu';
import type { ColumnDef } from '@tanstack/react-table';

import type {
  TournamentListItem,
  TournamentRowActionOptions,
} from '@/features/dashboard/types';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';

export function getTournamentsTableColumns(
  options: TournamentRowActionOptions
): Array<ColumnDef<TournamentListItem>> {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Tournament"
        />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.name}</span>
          <span className="text-muted-foreground truncate font-mono text-xs">
            {row.original.id.slice(-12)}
          </span>
        </div>
      ),
      enableSorting: true,
      enableHiding: false,
      meta: {
        label: 'Tournament',
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Status"
        />
      ),
      cell: ({ row }) => <TournamentStatusPill status={row.original.status} />,
      maxSize: 140,
      enableHiding: false,
      enableSorting: false,
      meta: {
        label: 'Status',
      },
    },
    {
      id: 'groups',
      accessorFn: (row) => row._count.groups,
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Groups"
        />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original._count.groups}</span>
      ),
      maxSize: 100,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'athletes',
      accessorFn: (row) => row._count.tournamentAthletes,
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Athletes"
        />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original._count.tournamentAthletes}
        </span>
      ),
      maxSize: 100,
      enableSorting: true,
      enableHiding: false,
    },
    {
      id: 'matches',
      accessorFn: (row) => row._count.matches,
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Matches"
        />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original._count.matches}</span>
      ),
      maxSize: 100,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Created"
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDistanceToNow(new Date(row.original.createdAt), {
            addSuffix: true,
          })}
        </span>
      ),
      maxSize: 160,
      enableSorting: true,
      enableHiding: false,
    },
    {
      id: 'actions',
      cell: ({ row }) => <TournamentsActionMenu options={options} row={row} />,
      maxSize: 32,
      minSize: 32,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
