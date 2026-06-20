import { MoreHorizontal } from 'lucide-react';
import type { DivisionData } from '@/contracts/tournament/division';
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

interface DivisionsTabsHeaderProps {
  divisions: Array<DivisionData>;
  selectedDivisionId: string | null;
  onSelect: (id: string) => void;
}

export function DivisionsTabsHeader({
  divisions,
  selectedDivisionId,
  onSelect,
}: DivisionsTabsHeaderProps) {
  const tabValue =
    divisions.length === 0
      ? ''
      : (selectedDivisionId ?? divisions[0]?.id ?? '');
  const divisionIdsKey = divisions.map((d) => d.id).join();

  const { register, scrollIdIntoView } = useScrollActiveIntoView({
    activeId: tabValue,
    rerollKey: `${tabValue}:${divisionIdsKey}:${divisions.length}`,
    enabled: divisions.length > 0,
  });

  function handlePickFromMenu(id: string) {
    onSelect(id);
    scrollIdIntoView(id);
  }

  if (divisions.length === 0) return null;

  return (
    <div className="relative shrink-0 border-b">
      <Tabs
        value={tabValue}
        onValueChange={(v) => {
          onSelect(v);
          scrollIdIntoView(v);
        }}
      >
        <div className="scrollbar-none overflow-x-auto overflow-y-hidden pr-10">
          <TabsList variant="line" className="h-auto min-w-min flex-nowrap">
            {divisions.map((d) => (
              <TabsTrigger
                key={d.id}
                ref={(el) => {
                  register(d.id, el);
                }}
                value={d.id}
                className="no-focus shrink-0 select-none!"
              >
                {d.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value={tabValue} className="sr-only">
          Division tab panel
        </TabsContent>
      </Tabs>

      <div className="bg-sidebar absolute inset-y-0 top-0 right-0 flex w-10 items-stretch justify-end border-l">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-full rounded-none border-none"
              aria-label="All divisions"
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
              Select a division
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={selectedDivisionId!}>
              {divisions.map((d) => (
                <DropdownMenuRadioItem
                  key={d.id}
                  value={d.id}
                  onSelect={() => handlePickFromMenu(d.id)}
                >
                  <span className="truncate">{d.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
