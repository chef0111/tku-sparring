import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { GroupData } from '@/features/dashboard/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface GroupsTabsHeaderProps {
  groups: Array<GroupData>;
  selectedGroupId: string | null;
  onSelect: (id: string) => void;
}

export function GroupsTabsHeader({
  groups,
  selectedGroupId,
  onSelect,
}: GroupsTabsHeaderProps) {
  const triggersRef = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  function scrollTriggerIntoView(id: string) {
    const el = triggersRef.current.get(id);
    el?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  function handlePickFromMenu(id: string) {
    onSelect(id);
    requestAnimationFrame(() => scrollTriggerIntoView(id));
  }

  if (groups.length === 0) return null;

  const tabValue = selectedGroupId ?? groups[0]?.id ?? '';

  return (
    <div className="relative shrink-0 border-b">
      <Tabs
        value={tabValue}
        onValueChange={(v) => {
          onSelect(v);
          requestAnimationFrame(() => scrollTriggerIntoView(v));
        }}
      >
        <div className="scrollbar-thin overflow-x-auto overflow-y-hidden pr-9">
          <TabsList variant="line" className="h-auto min-w-min flex-nowrap">
            {groups.map((g) => (
              <TabsTrigger
                key={g.id}
                ref={(el) => {
                  if (el) triggersRef.current.set(g.id, el);
                  else triggersRef.current.delete(g.id);
                }}
                value={g.id}
                className="shrink-0"
              >
                {g.name}{' '}
                <span className="text-muted-foreground text-xs tabular-nums">
                  ({g._count.tournamentAthletes})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value={tabValue} className="sr-only">
          Group tab panel
        </TabsContent>
      </Tabs>

      <div className="bg-sidebar/30 absolute inset-y-0 top-0 right-0 flex w-9 items-stretch justify-end border-l">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-full rounded-none"
              aria-label="All groups"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
            {groups.map((g) => (
              <DropdownMenuItem
                key={g.id}
                onSelect={() => handlePickFromMenu(g.id)}
              >
                <span className="truncate">{g.name}</span>{' '}
                <span
                  className={cn(
                    'text-muted-foreground text-xs tabular-nums',
                    g.id === selectedGroupId && 'text-foreground font-medium'
                  )}
                >
                  ({g._count.tournamentAthletes})
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
