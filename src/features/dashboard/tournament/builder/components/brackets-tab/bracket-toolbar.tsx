import { Eraser, Plus, RefreshCw, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import * as React from 'react';
import { useTournamentBracket } from '../../context/tournament-bracket/use-tournament-bracket';
import { CreateCustomMatchDialog } from './create-custom-match-dialog';
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
import { Card } from '@/components/ui/card';

export function BracketToolbar() {
  const {
    selectedGroupId: groupId,
    toolbarDisabled: disabled,
    readOnly,
    tournamentStatus,
    matches,
  } = useTournamentBracket();
  const shuffle = useShuffleBracket();
  const regenerate = useRegenerateBracket();
  const reset = useResetBracket();
  const [customOpen, setCustomOpen] = React.useState(false);

  const draftOnly = tournamentStatus !== 'draft';
  const blocked = disabled || readOnly || draftOnly || !groupId;
  const customBlocked =
    disabled ||
    readOnly ||
    !groupId ||
    tournamentStatus === 'completed' ||
    matches.length === 0;
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
    <>
      <Card className="bg-popover absolute top-1/3 left-3 z-10 flex -translate-y-1/3 flex-col gap-1 rounded-md border p-1 shadow-md">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                disabled={customBlocked}
                aria-label="Create custom match"
                className="rounded-sm"
                onClick={() => setCustomOpen(true)}
              >
                <Plus />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">
            {readOnly
              ? 'Read-only mode'
              : !groupId
                ? 'Select a group'
                : matches.length === 0
                  ? 'Generate a bracket first'
                  : tournamentStatus === 'completed'
                    ? 'Tournament completed'
                    : 'Add exhibition match'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                disabled={blocked || shuffle.isPending}
                aria-label="Shuffle bracket"
                className="rounded-sm"
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
      </Card>
      <CreateCustomMatchDialog open={customOpen} onOpenChange={setCustomOpen} />
    </>
  );
}
