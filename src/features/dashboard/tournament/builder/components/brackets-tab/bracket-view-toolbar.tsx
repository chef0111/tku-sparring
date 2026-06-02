import {
  Camera,
  Maximize2,
  Minimize2,
  Scan,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { useBracketChrome } from '../../context/bracket-chrome';
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
  const { isFullscreen, toggleFullscreen, setScreenshotOpen, captureTarget } =
    useBracketChrome();

  const canScreenshot = captureTarget != null;

  return (
    <Card
      className="bg-popover absolute top-2.5 right-2.5 z-10 flex flex-col gap-0.5 rounded-md border p-1 shadow-md ring-0"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 cursor-pointer"
            disabled={!canScreenshot}
            onClick={() => setScreenshotOpen(true)}
          >
            <Camera data-icon="inline-start" />
            <span className="sr-only">Screenshot</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Screenshot</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 cursor-pointer"
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
            className="size-8 cursor-pointer"
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
            className="size-8 cursor-pointer"
            onClick={onFit}
          >
            <Scan data-icon="inline-start" />
            <span className="sr-only">Fit to view</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Fit to view</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 cursor-pointer"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 data-icon="inline-start" />
            ) : (
              <Maximize2 data-icon="inline-start" />
            )}
            <span className="sr-only">
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </TooltipContent>
      </Tooltip>
    </Card>
  );
}
