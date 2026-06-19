import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

export function LoadingBracketState() {
  return (
    <Empty className="h-full min-h-48 -translate-y-8 border-none py-8">
      <EmptyHeader>
        <EmptyMedia>
          <Spinner className="size-8" />
        </EmptyMedia>
        <EmptyTitle>Loading bracket</EmptyTitle>
        <EmptyDescription>Fetching matches for this group.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
