import { MoreHorizontal } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
// import { OutOfRangeBadge, getViolations } from '../out-of-range-badge';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  GroupData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipTrigger,
// } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getBeltLabel, getGenderLabel } from '@/config/athlete';

interface GetGroupRosterColumnsArgs {
  group: GroupData;
  readOnly: boolean;
  otherGroups: Array<GroupData>;
  onUnassign: (athleteId: string) => void;
  onMove: (athleteId: string, targetGroupId: string) => void;
}

function NameCell({
  athlete,
  fromGroupId,
  readOnly,
}: {
  athlete: TournamentAthleteData;
  fromGroupId: string;
  readOnly: boolean;
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: athlete.id,
    data: { type: 'roster-athlete', athleteId: athlete.id, fromGroupId },
    disabled: readOnly,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex cursor-grab flex-col active:cursor-grabbing',
        isDragging && 'opacity-50',
        readOnly && 'cursor-default'
      )}
    >
      <p className="text-sm font-medium">{athlete.name}</p>
      <p className="text-muted-foreground text-xs">{athlete.affiliation}</p>
    </div>
  );
}

export function getGroupRosterColumns({
  group,
  readOnly,
  otherGroups,
  onUnassign,
  onMove,
}: GetGroupRosterColumnsArgs): Array<ColumnDef<TournamentAthleteData>> {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Name"
        />
      ),
      cell: ({ row }) => (
        <NameCell
          athlete={row.original}
          fromGroupId={group.id}
          readOnly={readOnly}
        />
      ),
      enableSorting: true,
      enableHiding: false,
      enableColumnFilter: false,
    },
    {
      id: 'gender',
      accessorKey: 'gender',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Gender"
        />
      ),
      cell: ({ row }) => {
        const gender = getGenderLabel(row.original.gender);
        const className =
          gender === 'Male'
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-500';
        return (
          <Badge
            variant="outline"
            className={cn('scale-110 font-medium', className)}
          >
            {gender}
          </Badge>
        );
      },
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
    },
    {
      id: 'beltLevel',
      accessorKey: 'beltLevel',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Belt"
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {getBeltLabel(row.original.beltLevel)}
        </span>
      ),
      enableSorting: true,
      enableHiding: false,
      enableColumnFilter: false,
    },
    {
      id: 'weight',
      accessorKey: 'weight',
      header: ({ column, table }) => (
        <DataTableColumnHeader
          column={column}
          state={table.getState()}
          label="Weight"
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.weight}kg</span>
      ),
      enableSorting: true,
      enableHiding: false,
      enableColumnFilter: false,
    },
    // {
    //   id: 'violations',
    //   header: () => (
    //     <Tooltip>
    //       <TooltipTrigger asChild>
    //         <AlertTriangle className="text-muted-foreground size-3.5" />
    //       </TooltipTrigger>
    //       <TooltipContent>Constraint violations</TooltipContent>
    //     </Tooltip>
    //   ),
    //   cell: ({ row }) => (
    //     <OutOfRangeBadge violations={getViolations(row.original, group)} />
    //   ),
    //   enableSorting: false,
    // },
    {
      id: 'actions',
      header: '',
      size: 40,
      cell: ({ row }) => {
        if (readOnly) return null;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute inset-2"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUnassign(row.original.id)}>
                Unassign
              </DropdownMenuItem>
              {otherGroups.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {otherGroups.map((g) => (
                      <DropdownMenuItem
                        key={g.id}
                        onClick={() => onMove(row.original.id, g.id)}
                      >
                        {g.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
