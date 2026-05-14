import { ListIcon, Scan, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type BracketViewToolbarProps = {
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  showArenaOrderButton?: boolean;
  arenaOrderDisabled?: boolean;
  arenaOrderDisabledTooltip?: string;
  onOpenArenaOrder?: () => void;
};

export function BracketViewToolbar({
  onFit,
  onZoomIn,
  onZoomOut,
  showArenaOrderButton = false,
  arenaOrderDisabled = false,
  arenaOrderDisabledTooltip,
  onOpenArenaOrder,
}: BracketViewToolbarProps) {
  return (
    <Card
      className="bg-popover absolute top-2.5 right-2.5 z-10 flex flex-col gap-0.5 rounded-md border p-1 shadow-md ring-0"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {showArenaOrderButton && onOpenArenaOrder ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8"
              disabled={arenaOrderDisabled}
              onClick={onOpenArenaOrder}
            >
              <ListIcon data-icon="inline-start" />
              <span className="sr-only">Match order</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {arenaOrderDisabled && arenaOrderDisabledTooltip
              ? arenaOrderDisabledTooltip
              : 'Match order'}
          </TooltipContent>
        </Tooltip>
      ) : null}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8"
            onClick={onZoomIn}
          >
            <ZoomIn data-icon="inline-start" />
            <span className="sr-only">Zoom in</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Zoom in</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8"
            onClick={onZoomOut}
          >
            <ZoomOut data-icon="inline-start" />
            <span className="sr-only">Zoom out</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Zoom out</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8"
            onClick={onFit}
          >
            <Scan data-icon="inline-start" />
            <span className="sr-only">Fit to view</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Fit to view</TooltipContent>
      </Tooltip>
    </Card>
  );
}
