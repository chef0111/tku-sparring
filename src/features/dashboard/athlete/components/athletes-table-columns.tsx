import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { AthleteProfileData } from '@/features/dashboard/types';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BELT_LEVELS,
  GENDER_OPTIONS,
  getBeltLabel,
  getGenderLabel,
} from '@/config/athlete';
import { cn } from '@/lib/utils';

interface ColumnOptions {
  onEdit: (athlete: AthleteProfileData) => void;
  onDelete: (athlete: AthleteProfileData) => void;
}

export function getAthletesTableColumns(
  options: ColumnOptions
): Array<ColumnDef<AthleteProfileData>> {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          className="xl:ml-1"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          className="xl:ml-1"
          aria-label="Select row"
        />
      ),
      size: 30,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'athleteCode',
      accessorKey: 'athleteCode',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Athlete ID" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-base">
          {row.original.athleteCode ?? '—'}
        </span>
      ),
      maxSize: 120,
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        label: 'Athlete ID',
        variant: 'text',
        placeholder: 'Search athlete ID...',
      },
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        label: 'Name',
        variant: 'text',
        placeholder: 'Search name...',
      },
    },
    {
      id: 'gender',
      accessorKey: 'gender',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Gender" />
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
      maxSize: 100,
      enableSorting: false,
      enableColumnFilter: true,
      meta: {
        label: 'Gender',
        variant: 'select',
        options: GENDER_OPTIONS.map((g) => ({
          label: g.label,
          value: g.value,
        })),
      },
    },
    {
      id: 'beltLevel',
      accessorKey: 'beltLevel',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Belt" />
      ),
      cell: ({ row }) => <span>{getBeltLabel(row.original.beltLevel)}</span>,
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        label: 'Belt Level',
        variant: 'select',
        options: BELT_LEVELS.map((b) => ({
          label: b.label,
          value: String(b.value),
        })),
      },
    },
    {
      id: 'weight',
      accessorKey: 'weight',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Weight" />
      ),
      cell: ({ row }) => <span>{row.original.weight} kg</span>,
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        label: 'Weight',
        variant: 'range',
        range: [20, 150],
        unit: 'kg',
      },
    },
    {
      id: 'affiliation',
      accessorKey: 'affiliation',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Affiliation" />
      ),
      cell: ({ row }) => <span>{row.original.affiliation}</span>,
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        label: 'Affiliation',
        variant: 'text',
        placeholder: 'Search affiliation...',
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 xl:-mr-2">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => options.onEdit(row.original)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => options.onDelete(row.original)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      maxSize: 0,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
