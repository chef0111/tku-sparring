import {
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface KeyRowProps {
  label: string;
  kbd: string;
  className?: string;
  labelClassName?: string;
}

const KeyRow = ({ label, kbd, className, labelClassName }: KeyRowProps) => (
  <div className="flex items-center justify-between">
    <span
      className={cn(
        'text-muted-foreground text-sm font-medium',
        labelClassName
      )}
    >
      {label}
    </span>
    <Kbd useHotkey className={className}>
      {kbd}
    </Kbd>
  </div>
);

export const Helps = () => {
  return (
    <FieldSet className="font-esbuild w-full gap-6">
      {/* System Controls */}
      <FieldGroup className="bg-card gap-4 rounded-md border p-4">
        <FieldLabel className="flex w-full justify-center text-center text-2xl font-semibold">
          SYSTEM KEY MAPPINGS
        </FieldLabel>
        <div className="flex flex-col gap-4">
          <KeyRow
            label="Open settings dialog"
            kbd={
              navigator.userAgent.toUpperCase().includes('MAC')
                ? '⌘ + ,'
                : 'Ctrl + ,'
            }
            labelClassName="text-lg leading-none"
          />
          <KeyRow
            label="Close settings dialog"
            kbd="Esc"
            className="size-8"
            labelClassName="text-lg leading-none"
          />
          <KeyRow
            label="Start/Stop Timer"
            kbd="Space"
            labelClassName="text-lg leading-none"
          />
          <KeyRow
            label="Undo player actions"
            kbd={
              navigator.userAgent.toUpperCase().includes('MAC')
                ? '⌘ + Z'
                : 'Ctrl + Z'
            }
            labelClassName="text-lg leading-none"
          />
        </div>
      </FieldGroup>

      <FieldSeparator />

      <div className="grid grid-cols-2 gap-12">
        {/* Red Player Controls */}
        <FieldGroup className="bg-card gap-4 rounded-md border p-4">
          <FieldLabel className="text-destructive font-sans text-2xl font-semibold">
            RED PLAYER
          </FieldLabel>
          <div className="flex flex-col gap-3">
            <KeyRow label="Foul (Penalty)" kbd="W" />
            <Separator />
            <KeyRow label="Head Kick (Crit) - 5 pts" kbd="E" />
            <KeyRow label="Trunk Kick (Crit) - 4 pts" kbd="Q" />
            <KeyRow label="Head Kick - 3 pts" kbd="D" />
            <KeyRow label="Trunk Kick - 2 pts" kbd="A" />
            <KeyRow label="Punch - 1 pt" kbd="S" />
          </div>
        </FieldGroup>

        {/* Blue Player Controls */}
        <FieldGroup className="bg-card gap-4 rounded-md border p-4">
          <FieldLabel className="font-sans text-2xl font-semibold text-blue-400">
            BLUE PLAYER
          </FieldLabel>
          <div className="flex flex-col gap-3">
            <KeyRow label="Foul (Penalty)" kbd="I" />
            <Separator />
            <KeyRow label="Head Kick (Crit) - 5 pts" kbd="U" />
            <KeyRow label="Body Kick (Crit) - 4 pts" kbd="O" />
            <KeyRow label="Head Kick - 3 pts" kbd="J" />
            <KeyRow label="Body Kick - 2 pts" kbd="L" />
            <KeyRow label="Punch - 1 pt" kbd="K" />
          </div>
        </FieldGroup>
      </div>
    </FieldSet>
  );
};
