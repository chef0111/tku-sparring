import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type InputProps = React.ComponentProps<typeof Input>;

export function PasswordInput(props: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        className="pr-10 [&::-ms-reveal]:hidden"
        type={showPassword ? 'text' : 'password'}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1.5 -translate-y-1/2 scale-100! hover:bg-transparent!"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <IconEyeOff className="size-5 shrink-0 opacity-50" />
        ) : (
          <IconEye className="size-5 shrink-0 opacity-50" />
        )}
      </Button>
    </div>
  );
}
