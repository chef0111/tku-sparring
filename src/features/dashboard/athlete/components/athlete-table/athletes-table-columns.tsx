import AthletesActionMenu from './athletes-action-menu';
import type {
  AthleteProfileData,
  ColumnOptions,
} from '@/features/dashboard/types';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BELT_LEVELS,
  GENDER_OPTIONS,
  getBeltLabel,
  getGenderLabel,
} from '@/config/athlete';
import { cn } from '@/lib/utils';

export function getAthletesTableColumns(
  options: ColumnOptions
): Array<ColumnDef<AthleteProfileData>> {
  const nameFilterQueryKey = options.nameFilterQueryKey ?? 'query';

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
      maxSize: 24,
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
          {row.original.athleteCode}
        </span>
      ),
      maxSize: 120,
      enableSorting: true,
      meta: {
        label: 'Athlete ID',
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
        placeholder:
          nameFilterQueryKey === 'query'
            ? 'Search athlete ID or name...'
            : 'Search name...',
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
        <DataTableColumnHeader column={column} label="Belt level" />
      ),
      cell: ({ row }) => <span>{getBeltLabel(row.original.beltLevel)}</span>,
      maxSize: 100,
      enableSorting: true,
      enableColumnFilter: true,
      meta: {
        label: 'Belt level',
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
      maxSize: 100,
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
      enableSorting: false,
      meta: {
        label: 'Affiliation',
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <AthletesActionMenu options={options} row={row} />,
      maxSize: 32,
      minSize: 40,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
