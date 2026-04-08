import { cn } from '@/lib/utils';

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const Header = ({ children, className }: HeaderProps) => {
  return (
    <header
      className={cn(
        'supports-backdrop-filter:bg-sidebar/70 fixed top-0 right-0 left-0 z-10 mx-auto flex h-14 items-center gap-2 border px-4',
        className
      )}
    >
      {children}
    </header>
  );
};
