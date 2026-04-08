import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
  name: string | undefined;
  image?: string | null;
  fallbackClassName?: string;
  href?: string | null;
}

const UserAvatar = ({
  name,
  image,
  className,
  fallbackClassName,
  ...props
}: UserAvatarProps) => {
  const initials = name
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar
      className={cn('after:no-focus no-focus relative', className)}
      {...props}
    >
      <AvatarImage src={image ?? ''} alt={name} className="object-cover" />
      <AvatarFallback
        className={cn(
          'font-esbuild no-copy text-background bg-transparent font-bold tracking-wider',
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
