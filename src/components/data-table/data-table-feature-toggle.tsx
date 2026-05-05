import { Settings2 } from 'lucide-react';
import * as React from 'react';
import { featureFlagConfig } from '@/config/feature-flags';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DataTableFeatureToggleProps {
  align?: React.ComponentProps<typeof DropdownMenuContent>['align'];
}

export function DataTableFeatureToggle({
  align = 'end',
}: DataTableFeatureToggleProps) {
  const { isEnabled, toggleFlag } = useFeatureFlags();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Toggle features"
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 font-normal lg:flex"
        >
          <Settings2 className="text-muted-foreground" />
          Features
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        <DropdownMenuLabel>Feature flags</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {featureFlagConfig.dataTable.map((flag) => (
          <Tooltip key={flag.value}>
            <TooltipTrigger asChild>
              <DropdownMenuCheckboxItem
                checked={isEnabled(flag.value)}
                onCheckedChange={() => toggleFlag(flag.value)}
              >
                <flag.icon className="text-muted-foreground size-4 shrink-0" />
                {flag.label}
              </DropdownMenuCheckboxItem>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex flex-col gap-1">
              <p className="font-medium">{flag.tooltipTitle}</p>
              <p className="text-muted-foreground">{flag.tooltipDescription}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
