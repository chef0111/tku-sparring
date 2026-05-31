import type { BracketCanvasLayout } from '@/lib/tournament/bracket-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bracketConfig } from '@/config/bracket';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type BracketLayoutToggleProps = {
  value: BracketCanvasLayout;
  onChange: (next: BracketCanvasLayout) => void;
};

export function BracketLayoutToggle({
  value,
  onChange,
}: BracketLayoutToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        if (next === 'two-sided' || next === 'one-sided') onChange(next);
      }}
      className="absolute top-2.5 left-2.5 z-10"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <TabsList aria-label="Bracket canvas layout" className="h-10! gap-1 p-1">
        {bracketConfig.map((layout) => (
          <Tooltip key={layout.value} delayDuration={300}>
            <TooltipTrigger>
              <TabsTrigger
                key={layout.value}
                value={layout.value}
                aria-label={layout.label}
                className="size-8"
              >
                <layout.icon className="size-4" />
                <span className="sr-only">{layout.label}</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent
              align="start"
              side="bottom"
              sideOffset={6}
              className="bg-background text-foreground flex max-w-64 flex-col gap-1 border py-2 font-semibold [&>span]:hidden"
            >
              <div className="w-full text-left">{layout.label}</div>
              <p className="text-muted-foreground text-xs text-pretty">
                {layout.description}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TabsList>
    </Tabs>
  );
}
