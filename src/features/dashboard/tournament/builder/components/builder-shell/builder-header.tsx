import type { TournamentData } from '@/features/dashboard/types';
import type { User } from '@/lib/auth';
import { TournamentStatusPill } from '@/features/dashboard/tournament/list/components/tournament-status-pill';
import { UserDropdown } from '@/components/user/user-dropdown';
import { LogoIcon } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ButtonGroupSeparator } from '@/components/ui/button-group';

interface BuilderHeaderProps {
  tournament: TournamentData;
  tab: 'groups' | 'brackets';
  onTabChange: (value: 'groups' | 'brackets') => void;
  user: User | null | undefined;
}

export function BuilderHeader({
  tournament,
  tab,
  onTabChange,
  user,
}: BuilderHeaderProps) {
  return (
    <header className="bg-sidebar/70 supports-backdrop-filter:bg-sidebar/50 sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <div className="bg-sidebar-foreground text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
          <LogoIcon className="size-4 invert" />
        </div>
        <h1 className="text-lg font-semibold">{tournament.name}</h1>
        <Badge className="bg-primary/10 text-primary rounded text-xs font-medium">
          Builder
        </Badge>
        <TournamentStatusPill status={tournament.status} className="ml-1" />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as 'groups' | 'brackets')}
        className="absolute top-2.5 left-1/2 h-10 -translate-x-1/2"
      >
        <TabsList className="bg-sidebar border-2 p-0">
          <TabsTrigger
            value="groups"
            className="w-32 rounded-r-none border-none px-4 text-lg"
          >
            Groups
          </TabsTrigger>
          <ButtonGroupSeparator />
          <TabsTrigger
            value="brackets"
            className="w-32 rounded-l-none border-none px-4 text-lg"
          >
            Brackets
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="ml-auto flex items-center">
        {user && <UserDropdown user={user} className="-mr-2 scale-95" />}
      </div>
    </header>
  );
}
