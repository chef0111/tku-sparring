import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ActivityEventRowData {
  id: string;
  summary: string;
  adminName: string;
  createdAt: Date | string;
}

export function ActivityEventRow({ row }: { row: ActivityEventRowData }) {
  const createdAt =
    row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);

  return (
    <li className="border-border rounded-md border px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-snug">{row.summary}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <time
              className="text-muted-foreground shrink-0 text-xs whitespace-nowrap"
              dateTime={createdAt.toISOString()}
            >
              {formatDistanceToNow(createdAt, { addSuffix: true })}
            </time>
          </TooltipTrigger>
          <TooltipContent side="left">
            {createdAt.toLocaleString()}
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{row.adminName}</p>
    </li>
  );
}
