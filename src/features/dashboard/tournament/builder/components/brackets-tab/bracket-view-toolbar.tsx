import { Scan, ZoomIn, ZoomOut } from 'lucide-react';

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
};

export function BracketViewToolbar({
  onFit,
  onZoomIn,
  onZoomOut,
}: BracketViewToolbarProps) {
  return (
    <Card
      className="bg-popover absolute top-9 right-2.5 z-10 flex -translate-y-1/4 flex-col gap-0.5 rounded-md border p-1 shadow-md ring-0"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
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
