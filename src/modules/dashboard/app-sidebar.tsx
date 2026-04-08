import * as React from 'react';
import { Link } from '@tanstack/react-router';
import {
  CircleHelpIcon,
  Home,
  SearchIcon,
  Settings2Icon,
  Trophy,
  UserCog,
} from 'lucide-react';
import { NavSecondary } from './nav-secondary';
import { LogoIcon } from '@/components/ui/logo';
import { NavMain } from '@/modules/dashboard/nav-main';
import { UserNav } from '@/components/user/user-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navMain = [
  { title: 'Home', icon: Home, to: '/dashboard' },
  { title: 'Tournaments', icon: Trophy, to: '/dashboard/tournament' },
  { title: 'Athletes', icon: UserCog, to: '/dashboard/athletes' },
];
const navSecondary = [
  {
    title: 'Settings',
    url: '#',
    icon: Settings2Icon,
  },
  {
    title: 'Get Help',
    url: '#',
    icon: CircleHelpIcon,
  },
  {
    title: 'Search',
    url: '#',
    icon: SearchIcon,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                  <LogoIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TKU Sparring</span>
                  <span className="truncate text-xs">Tournament Manager</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary
          items={navSecondary}
          className="absolute bottom-16 pr-16 transition-all duration-200 group-data-[collapsible=icon]:bottom-12"
        />
      </SidebarContent>

      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
