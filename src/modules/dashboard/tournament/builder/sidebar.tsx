import { Link } from '@tanstack/react-router';
import { ArrowLeft, Settings, Trash2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LogoIcon } from '@/components/ui/logo';

interface BuilderSidebarProps {
  tournamentId: string;
  onEditTournament: () => void;
  onDeleteTournament: () => void;
}

export function BuilderSidebar({
  tournamentId,
  onEditTournament,
  onDeleteTournament,
}: BuilderSidebarProps) {
  return (
    <Sidebar
      variant="floating"
      side="left"
      collapsible="icon"
      className="top-16 z-50 mx-2 h-fit max-h-[calc(100vh-4rem)] py-4 group-data-[collapsible=icon]:pr-1"
    >
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-sidebar-foreground text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                <LogoIcon className="size-4 invert" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">TKU Sparring</span>
                <span className="text-muted-foreground truncate text-xs">
                  Tournament Builder
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tournament</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:mx-0.75">
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Edit Tournament"
                  onClick={onEditTournament}
                >
                  <Settings className="size-4" />
                  <span className="transition-none!">Edit Tournament</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Delete Tournament"
                  onClick={onDeleteTournament}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  <span className="transition-none!">Delete Tournament</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              size="sm"
              className="bg-accent h-8 w-full justify-center"
              asChild
            >
              <Link
                to="/dashboard/tournament/$id"
                params={{ id: tournamentId }}
              >
                <ArrowLeft className="size-4" />
                <span className="truncate group-data-[collapsible=icon]:hidden">
                  Back to Detail
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
