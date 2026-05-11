import * as React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Row } from '@tanstack/react-table';

import type {
  TournamentListItem,
  TournamentRowActionOptions,
} from '@/features/dashboard/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TournamentsActionMenuProps {
  options: TournamentRowActionOptions;
  row: Row<TournamentListItem>;
}

export function TournamentsActionMenu({
  options,
  row,
}: TournamentsActionMenuProps) {
  const navigate = useNavigate();

  const stopRowClick = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <DropdownMenu>
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
