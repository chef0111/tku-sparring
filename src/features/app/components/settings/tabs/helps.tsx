import { blueKeys, redKeys, systemKeys } from './data/helps';
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
    <FieldSet className="w-full gap-6">
      {/* System Controls */}
      <FieldGroup className="bg-card gap-4 rounded-md border p-4">
        <FieldLabel className="flex w-full justify-center text-center text-2xl font-semibold">
          SYSTEM KEY MAPPINGS
        </FieldLabel>
        <div className="flex flex-col gap-4">
          {systemKeys.map((item, i) => {
            const kbd = typeof item.kbd === 'function' ? item.kbd() : item.kbd;
            return (
              <KeyRow
                key={item.label ?? `system-${i}`}
                label={item.label ?? ''}
                kbd={kbd ?? ''}
                className={item.className}
                labelClassName="text-lg leading-none"
              />
            );
          })}
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
            {redKeys.map((item, i) =>
              item.isSeparator ? (
                <Separator key={`red-sep-${i}`} />
              ) : (
                <KeyRow
                  key={item.label ?? `red-${i}`}
                  label={item.label ?? ''}
                  kbd={
                    typeof item.kbd === 'function'
                      ? item.kbd()
                      : (item.kbd ?? '')
                  }
                  className={item.className}
                  labelClassName={item.labelClassName}
                />
              )
            )}
          </div>
        </FieldGroup>

        {/* Blue Player Controls */}
        <FieldGroup className="bg-card gap-4 rounded-md border p-4">
          <FieldLabel className="font-sans text-2xl font-semibold text-blue-400">
            BLUE PLAYER
          </FieldLabel>
          <div className="flex flex-col gap-3">
            {blueKeys.map((item, i) =>
              item.isSeparator ? (
                <Separator key={`blue-sep-${i}`} />
              ) : (
                <KeyRow
                  key={item.label ?? `blue-${i}`}
                  label={item.label ?? ''}
                  kbd={
                    typeof item.kbd === 'function'
                      ? item.kbd()
                      : (item.kbd ?? '')
                  }
                  className={item.className}
                  labelClassName={item.labelClassName}
                />
              )
            )}
          </div>
        </FieldGroup>
      </div>
    </FieldSet>
  );
};
