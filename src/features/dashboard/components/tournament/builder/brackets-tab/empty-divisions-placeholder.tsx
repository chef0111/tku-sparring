import { Trophy } from 'lucide-react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function EmptyDivisionsPlaceholder() {
  return (
    <Empty className="canvas-background flex h-full flex-col items-center justify-center pb-20">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-14">
          <Trophy className="text-muted-foreground size-8" />
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold">
          No divisions yet
        </EmptyTitle>
        <EmptyDescription>
          Create divisions and assign athletes before generating brackets.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
