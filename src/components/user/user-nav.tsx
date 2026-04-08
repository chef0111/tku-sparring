import { ChevronsUpDown, Home, LogOutIcon, Shield } from 'lucide-react';

import { toast } from 'sonner';
import { Link, useRouter } from '@tanstack/react-router';
import UserAvatar from './user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';

export function UserNav() {
  const { data, isPending } = authClient.useSession();
  const { isMobile } = useSidebar();
  const user = data?.user;

  if (!user || isPending)
    return <Skeleton className="h-10 w-full rounded-lg" />;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                name={user.name}
                image={user.image}
                className="size-12 rounded-lg max-sm:size-8 lg:size-8"
                fallbackClassName="rounded-lg max-sm:text-sm text-xl lg:text-sm"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) rounded-lg border"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <UserAvatar
                    name={user.name}
                    image={user.image}
                    className="bg-foreground size-8"
                  />
                  <div className="absolute right-0 bottom-0">
                    <span className="relative flex items-center justify-center">
                      <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                      <span className="sr-only">Online</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="mb-0.5">{user.name}</span>
                  <Badge className="-ml-1 scale-90 border border-blue-500/50 bg-blue-500/20 text-blue-500">
                    <Shield />
                    Admin
                  </Badge>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/" target="_blank">
                  <Home />
                  Home
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <LogoutItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function LogoutItem() {
  const router = useRouter();

  async function handleSignOut() {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(error.message || 'Something went wrong');
    } else {
      toast.success('Signed out successfully');
      router.invalidate();
    }
  }

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      <LogOutIcon className="size-4" /> <span>Sign out</span>
    </DropdownMenuItem>
  );
}
