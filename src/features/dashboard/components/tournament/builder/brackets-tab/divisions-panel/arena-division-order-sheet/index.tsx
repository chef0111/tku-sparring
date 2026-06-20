import { ArenaDivisionOrdersPanel } from './arena-division-orders-panel';
import type { DivisionData } from '@/contracts/tournament/division';
import { useBracketChrome } from '@/features/dashboard/contexts/bracket-chrome';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface ArenaDivisionOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  divisions: Array<DivisionData>;
  readOnly: boolean;
}

export function ArenaDivisionOrderSheet({
  open,
  onOpenChange,
  tournamentId,
  divisions,
  readOnly,
}: ArenaDivisionOrderSheetProps) {
  const { isFullscreen } = useBracketChrome();

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className={cn(
          'flex w-full flex-col gap-0 overflow-hidden sm:max-w-md',
          isFullscreen && 'z-[70]'
        )}
        showCloseButton
      >
        <SheetHeader className="border-border shrink-0 border-b">
          <SheetTitle className="text-lg">Arena match order</SheetTitle>
          <SheetDescription>
            Drag divisions to set run order on each shared arena. This order is
            used for match numbering across divisions.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <ArenaDivisionOrdersPanel
            tournamentId={tournamentId}
            divisions={divisions}
            readOnly={readOnly}
            className="pt-4"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
