import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';
import type { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/themes';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  className?: string;
}

export function ThemeToggle({
  variant = 'outline',
  size = 'icon',
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!isMounted) {
    return <div className="flex h-8 w-8" />;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn('scale-100!', className)}
    >
      <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
