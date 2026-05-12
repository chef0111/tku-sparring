import { Eraser, RefreshCw, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useRegenerateBracket,
  useResetBracket,
  useShuffleBracket,
} from '@/queries/matches';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BracketToolbarProps {
  groupId: string | null;
  disabled: boolean;
  readOnly: boolean;
  tournamentStatus: string;
}

export function BracketToolbar({
  groupId,
  disabled,
  readOnly,
  tournamentStatus,
}: BracketToolbarProps) {
  const shuffle = useShuffleBracket();
  const regenerate = useRegenerateBracket();
  const reset = useResetBracket();

  const draftOnly = tournamentStatus !== 'draft';
  const blocked = disabled || readOnly || draftOnly || !groupId;
  const reason = draftOnly
    ? 'Only available in Draft status'
    : readOnly
      ? 'Read-only mode'
      : disabled
        ? 'Generate a bracket first'
        : undefined;

  function wrap<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
    }
  ) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (e) => (e instanceof Error ? e.message : 'Request failed'),
    });
  }

  return (
    <div className="bg-popover absolute top-1/3 left-3 z-10 flex -translate-y-1/3 flex-col gap-1 rounded-lg border p-1 shadow-md">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={blocked || shuffle.isPending}
              aria-label="Shuffle bracket"
              onClick={() => {
                if (!groupId) return;
                void wrap(shuffle.mutateAsync({ groupId }), {
                  loading: 'Shuffling bracket…',
                  success: 'Bracket shuffled',
                });
              }}
            >
              <Shuffle />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          {reason ?? 'Shuffle athletes'}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={blocked || regenerate.isPending}
              aria-label="Regenerate bracket"
              onClick={() => {
                if (!groupId) return;
                void wrap(regenerate.mutateAsync({ groupId }), {
                  loading: 'Regenerating bracket…',
                  success: 'Bracket shell recreated',
                });
              }}
            >
              <RefreshCw />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          {reason ?? 'Regenerate bracket'}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={blocked || reset.isPending}
              aria-label="Reset bracket"
              onClick={() => {
                if (!groupId) return;
                void wrap(reset.mutateAsync({ groupId }), {
                  loading: 'Resetting bracket…',
                  success: 'Bracket cleared',
                });
              }}
            >
              <Eraser />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          {reason ?? 'Reset bracket'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
