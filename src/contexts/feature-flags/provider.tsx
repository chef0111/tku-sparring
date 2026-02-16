import * as React from 'react';
import { parseAsStringEnum, useQueryState } from 'nuqs';

import { FeatureFlagsContext } from './context';
import type { FeatureFlagsContextValue, FilterFlag } from './context';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagConfig } from '@/config/flag';

const filterFlagValues = flagConfig.featureFlags.map((flag) => flag.value);

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
}

export function FeatureFlagsProvider({ children }: FeatureFlagsProviderProps) {
  const [filterFlag, setFilterFlag] = useQueryState(
    'filterFlag',
    parseAsStringEnum(filterFlagValues).withOptions({
      clearOnDefault: true,
      shallow: true,
    })
  );

  const onFilterFlagChange = React.useCallback(
    (groupValue: Array<unknown>) => {
      const newValue =
        groupValue.length > 0 ? String(groupValue[groupValue.length - 1]) : '';
      void setFilterFlag(
        newValue && filterFlagValues.includes(newValue as FilterFlag)
          ? (newValue as FilterFlag)
          : null
      );
    },
    [setFilterFlag]
  );

  const contextValue = React.useMemo<FeatureFlagsContextValue>(
    () => ({
      filterFlag,
      enableAdvancedFilter:
        filterFlag === 'advancedFilters' || filterFlag === 'commandFilters',
    }),
    [filterFlag]
  );

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      <div className="w-full overflow-x-auto p-1">
        <ToggleGroup
          variant="outline"
          size="sm"
          value={filterFlag ? [filterFlag] : []}
          onValueChange={onFilterFlagChange}
          className="w-fit gap-0"
        >
          {flagConfig.featureFlags.map((flag) => (
            <Tooltip key={flag.value} delay={700}>
              <ToggleGroupItem
                value={flag.value}
                className="px-3 text-xs whitespace-nowrap"
                render={
                  <TooltipTrigger>
                    <flag.icon className="size-3.5 shrink-0" />
                    {flag.label}
                  </TooltipTrigger>
                }
              />
              <TooltipContent
                align="start"
                side="bottom"
                sideOffset={6}
                className="bg-background text-foreground flex flex-col gap-1.5 border py-2 font-semibold [&>span]:hidden"
              >
                <div>{flag.tooltipTitle}</div>
                <p className="text-muted-foreground text-xs text-balance">
                  {flag.tooltipDescription}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </ToggleGroup>
      </div>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
