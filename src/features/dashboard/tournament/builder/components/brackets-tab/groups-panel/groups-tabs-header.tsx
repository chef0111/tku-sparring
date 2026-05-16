import { MoreHorizontal } from 'lucide-react';
import type { GroupData } from '@/features/dashboard/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useScrollActiveIntoView } from '@/hooks/use-scroll-active-into-view';

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
  const tabValue =
    groups.length === 0 ? '' : (selectedGroupId ?? groups[0]?.id ?? '');
  const groupIdsKey = groups.map((g) => g.id).join();

  const { register, scrollIdIntoView } = useScrollActiveIntoView({
    activeId: tabValue,
    rerollKey: `${tabValue}:${groupIdsKey}:${groups.length}`,
    enabled: groups.length > 0,
  });

  function handlePickFromMenu(id: string) {
    onSelect(id);
    scrollIdIntoView(id);
  }

  if (groups.length === 0) return null;

  return (
    <div className="relative shrink-0 border-b">
      <Tabs
        value={tabValue}
        onValueChange={(v) => {
          onSelect(v);
          scrollIdIntoView(v);
        }}
      >
        <div className="scrollbar-thin overflow-x-auto overflow-y-hidden pr-10">
          <TabsList variant="line" className="h-auto min-w-min flex-nowrap">
            {groups.map((g) => (
              <TabsTrigger
                key={g.id}
                ref={(el) => {
                  register(g.id, el);
                }}
                value={g.id}
                className="shrink-0 select-none!"
              >
                {g.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value={tabValue} className="sr-only">
          Group tab panel
        </TabsContent>
      </Tabs>

      <div className="bg-sidebar absolute inset-y-0 top-0 right-0 flex w-10 items-stretch justify-end border-l">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-full rounded-none border-none"
              aria-label="All groups"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            alignOffset={4}
            className="max-h-70 w-auto overflow-y-auto"
          >
            <DropdownMenuLabel className="text-center text-sm leading-none">
              Select a group
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={selectedGroupId!}>
              {groups.map((g) => (
                <DropdownMenuRadioItem
                  key={g.id}
                  value={g.id}
                  onSelect={() => handlePickFromMenu(g.id)}
                >
                  <span className="truncate">{g.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
