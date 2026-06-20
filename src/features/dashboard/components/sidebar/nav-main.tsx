import { Link, useLocation } from '@tanstack/react-router';
import { CirclePlusIcon, TrophyIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NavMain({
  items,
}: {
  items: Array<{
    title: string;
    icon: LucideIcon;
    to: string;
  }>;
}) {
  const pathname = useLocation().pathname;

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              data-slot="button"
              data-variant="default"
              tooltip="Quick Create"
              className={cn(
                'ring-primary dark:ring-ring text-primary-foreground! h-7.5 min-w-8 border-none bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--accent-foreground)_80%,transparent),var(--primary-accent))] shadow-none ring-1 dark:bg-[linear-gradient(to_top,var(--primary),var(--primary-accent))]'
              )}
            >
              <CirclePlusIcon />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="pointer-events-none size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <TrophyIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={pathname === item.to}
                tooltip={item.title}
                asChild
              >
                <Link to={item.to}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
