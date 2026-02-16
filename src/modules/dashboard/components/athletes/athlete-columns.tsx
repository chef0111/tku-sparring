import { Award, Building, Hash, Scale, User } from 'lucide-react';
import { beltLevels } from '../../tournament/common/constant';
import type { ColumnDef } from '@tanstack/react-table';
import type { AthleteDTO } from '@/orpc/athletes/athletes.dto';
import type { DataTableRowAction } from '@/types/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DragHandle } from '@/components/data-table/drag-handle';
import { Checkbox } from '@/components/ui/checkbox';

interface GetAthleteColumnsProps {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<AthleteDTO> | null>
  >;
  enableDrag?: boolean;
}

export function getAthleteColumns({
  setRowAction: _setRowAction,
  enableDrag,
}: GetAthleteColumnsProps): Array<ColumnDef<AthleteDTO>> {
  const dragColumn: ColumnDef<AthleteDTO> = {
    id: 'drag',
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.id} />,
    enableHiding: false,
    enableSorting: false,
    size: 40,
  };

  const baseColumns: Array<ColumnDef<AthleteDTO>> = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          className="translate-y-0.5 rounded-[5px]"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          className="translate-y-0.5 rounded-[5px]"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 40,
    },
    {
      id: 'code',
      accessorKey: 'code',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Athlete" />
      ),
      cell: ({ row }) => <div className="max-w-32">{row.getValue('code')}</div>,
      meta: {
        label: 'Athlete',
        placeholder: 'Search athlete IDs...',
        variant: 'text',
        icon: Hash,
      },
      enableColumnFilter: true,
      enableSorting: true,
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Athlete Name" />
      ),
      cell: ({ row }) => (
        <div className="min-w-44 truncate font-medium">
          {row.getValue('name')}
        </div>
      ),
      meta: {
        label: 'Athlete Name',
        placeholder: 'Search athlete names...',
        variant: 'text',
        icon: User,
      },
      enableColumnFilter: true,
      enableSorting: true,
    },
    {
      id: 'beltLevel',
      accessorKey: 'beltLevel',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Belt Level" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue('beltLevel')}</div>
      ),
      meta: {
        label: 'Belt Level',
        placeholder: 'Filter belt levels...',
        variant: 'multiSelect',
        options: beltLevels,
        icon: Award,
      },
      enableColumnFilter: true,
      enableSorting: true,
    },
    {
      id: 'weight',
      accessorKey: 'weight',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Weight" />
      ),
      cell: ({ row }) => (
        <div className="max-w-24 tabular-nums">
          {row.getValue<number>('weight').toFixed(1)} kg
        </div>
      ),
      meta: {
        label: 'Weight',
        placeholder: 'Search weight...',
        variant: 'range',
        range: [0, 150],
        unit: 'kg',
        icon: Scale,
      },
      enableColumnFilter: true,
      enableSorting: true,
    },
    {
      id: 'affiliation',
      accessorKey: 'affiliation',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Affiliation" />
      ),
      cell: ({ row }) => (
        <div className="min-w-44 truncate">{row.getValue('affiliation')}</div>
      ),
      meta: {
        label: 'Affiliation',
        placeholder: 'Search affiliations...',
        variant: 'text',
        icon: Building,
      },
      enableColumnFilter: true,
      enableSorting: true,
    },
  ];

  return enableDrag ? [dragColumn, ...baseColumns] : baseColumns;
}
