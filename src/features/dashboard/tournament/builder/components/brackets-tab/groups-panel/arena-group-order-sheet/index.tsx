import { ArenaGroupOrdersPanel } from './arena-group-orders-panel';
import type { GroupData } from '@/features/dashboard/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ArenaGroupOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  groups: Array<GroupData>;
  readOnly: boolean;
}

export function ArenaGroupOrderSheet({
  open,
  onOpenChange,
  tournamentId,
  groups,
  readOnly,
}: ArenaGroupOrderSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-md"
        showCloseButton
      >
        <SheetHeader className="border-border shrink-0 border-b">
          <SheetTitle className="text-lg">Arena match order</SheetTitle>
          <SheetDescription>
            Drag groups to set run order on each shared arena. This order is
            used for match numbering across groups.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <ArenaGroupOrdersPanel
            tournamentId={tournamentId}
            groups={groups}
            readOnly={readOnly}
            className="pt-4"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
