import * as React from 'react';
import { TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

interface RetireArenaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromArena: number;
  targetArenaOptions: Array<number>;
  groupCountOnSource: number;
  isPending: boolean;
  onConfirm: (toArena: number) => void;
}

export function RetireArenaDialog({
  open,
  onOpenChange,
  fromArena,
  targetArenaOptions,
  groupCountOnSource,
  isPending,
  onConfirm,
}: RetireArenaDialogProps) {
  const [toArena, setToArena] = React.useState<number>(
    targetArenaOptions[0] ?? 1
  );

  React.useEffect(() => {
    if (open && targetArenaOptions.length > 0) {
      setToArena(targetArenaOptions[0]!);
    }
  }, [open, targetArenaOptions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4" showCloseButton>
        <DialogHeader>
          <DialogTitle>Remove arena {fromArena}</DialogTitle>
          <DialogDescription>
            {groupCountOnSource > 0
              ? `Move all ${groupCountOnSource} group${groupCountOnSource === 1 ? '' : 's'} on this arena to one other arena. Match numbering order will be updated.`
              : 'Remove this empty arena slot from the tournament layout.'}
          </DialogDescription>
        </DialogHeader>

        {groupCountOnSource > 0 ? (
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="retire-arena-target">
                Move groups to
              </FieldLabel>
              <Select
                value={String(toArena)}
                onValueChange={(v) => setToArena(Number(v))}
                disabled={isPending}
              >
                <SelectTrigger id="retire-arena-target" className="w-full">
                  <SelectValue placeholder="Choose arena" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {targetArenaOptions.map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        Arena {a}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending || targetArenaOptions.length === 0}
            onClick={() => onConfirm(toArena)}
          >
            {isPending ? (
              <>
                <Spinner
                  data-icon="inline-start"
                  className="text-destructive"
                />
                Removing…
              </>
            ) : (
              <>
                <TrashIcon className="text-destructive" />
                Remove arena
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
