import type { ComponentProps } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return words
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function AthleteAvatar({
  name,
  image,
  className,
  size = 'sm',
}: {
  name: string;
  image?: string | null;
  className?: string;
  size?: ComponentProps<typeof Avatar>['size'];
}) {
  const initials = initialsFromName(name);

  return (
    <Avatar size={size} className={cn('shrink-0', className)}>
      <AvatarImage src={image?.trim() ? image : ''} alt={name || 'Athlete'} />
      <AvatarFallback className="text-muted-foreground text-xs font-medium">
        {initials || '?'}
      </AvatarFallback>
    </Avatar>
  );
}
