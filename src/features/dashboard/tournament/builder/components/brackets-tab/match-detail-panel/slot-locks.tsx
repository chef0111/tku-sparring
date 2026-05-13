import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';

export interface SlotLocksProps {
  matchId: string;
  redLocked: boolean;
  blueLocked: boolean;
  isPending: boolean;
  onLockChange: (side: 'red' | 'blue', locked: boolean) => void;
}

export function SlotLocks({
  matchId,
  redLocked,
  blueLocked,
  isPending,
  onLockChange,
}: SlotLocksProps) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-sm font-medium">Slot locks</h4>
      <FieldGroup className="gap-3">
        <Field orientation="horizontal">
          <Checkbox
            id={`${matchId}-lock-red`}
            checked={Boolean(redLocked)}
            disabled={isPending}
            onCheckedChange={(v) => onLockChange('red', v === true)}
          />
          <FieldLabel htmlFor={`${matchId}-lock-red`} className="font-normal">
            Lock red corner
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            id={`${matchId}-lock-blue`}
            checked={Boolean(blueLocked)}
            disabled={isPending}
            onCheckedChange={(v) => onLockChange('blue', v === true)}
          />
          <FieldLabel htmlFor={`${matchId}-lock-blue`} className="font-normal">
            Lock blue corner
          </FieldLabel>
        </Field>
      </FieldGroup>
    </section>
  );
}
