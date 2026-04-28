import { LogInIcon, MenuIcon } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { UserDropdown } from '../user/user-dropdown';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useSettings } from '@/contexts/settings';
import { AppSettings } from '@/features/app/settings';

export const Navbar = () => {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  const { isOpen, setIsOpen } = useSettings();

  return (
    <nav className="bg-backround flex h-20 w-full items-center justify-between">
      <div className="flex w-[13vw] shrink-0 items-center justify-center gap-4">
        <img
          src="assets/uit.webp"
          loading="eager"
          alt="UIT Logo"
          className="h-12 select-none"
        />
        <img
          src="assets/tku.webp"
          loading="eager"
          alt="TKU Logo"
          className="h-14 select-none"
        />
      </div>
      <div className="flex w-full grow items-center justify-center">
        <h1 className="text-5xl font-bold select-none">TKU Sparring System</h1>
      </div>
      <div className="flex w-[13vw] shrink-0 items-center justify-end px-2.5">
        {isPending ? null : user ? (
          <UserDropdown user={user} />
        ) : (
          <Link to="/login">
            <Button variant="outline" size="lg" className="mx-1 text-lg">
              <LogInIcon className="size-5" /> Login
            </Button>
          </Link>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="no-focus mx-2.5 size-12! hover:bg-transparent"
            >
              <MenuIcon className="size-12" />
            </Button>
          </DialogTrigger>
          <AppSettings />
        </Dialog>
      </div>
    </nav>
  );
};
