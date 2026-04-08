import { LayoutDashboard, LogOutIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from '@tanstack/react-router';
import UserAvatar from './user-avatar';
import type { User } from '@/lib/auth';
import { authClient } from '@/lib/auth-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserDropdownProps {
  user: User;
  className?: string;
}

export function UserDropdown({ user, className }: UserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={className}>
        <UserAvatar
          name={user.name}
          image={user.image}
          className="border-foreground bg-background size-10 cursor-pointer rounded-full border object-cover"
        />
      </DropdownMenuTrigger>
      <DropdownMenuGroup>
        <DropdownMenuContent align="end" className="w-35 border">
          <DropdownMenuLabel className="flex items-center gap-2">
            <div className="relative flex items-center">
              <UserAvatar
                name={user.name}
                image={user.image}
                className="bg-foreground size-7"
              />
              <div className="absolute right-0 bottom-0">
                <span className="relative flex items-center justify-center">
                  <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                  <span className="sr-only">Online</span>
                </span>
              </div>
            </div>
            {user.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link to="/dashboard" target="_blank">
            <DropdownMenuItem>
              <LayoutDashboard />
              Dashboard
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSeparator />
          <SignOutItem />
        </DropdownMenuContent>
      </DropdownMenuGroup>
    </DropdownMenu>
  );
}

function SignOutItem() {
  const navigate = useNavigate();

  async function handleSignOut() {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(error.message || 'Something went wrong');
    } else {
      toast.success('Signed out successfully');
      navigate({ to: '/' });
    }
  }

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      <LogOutIcon className="size-4" /> <span>Sign out</span>
    </DropdownMenuItem>
  );
}
