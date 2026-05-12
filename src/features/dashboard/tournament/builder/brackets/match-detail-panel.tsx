import * as React from 'react';
import { ArrowLeftRight, Crown, Minus, Plus } from 'lucide-react';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  useSetWinner,
  useSwapParticipants,
  useUpdateScore,
} from '@/queries/matches';
import { cn } from '@/lib/utils';

interface MatchDetailPanelProps {
  match: MatchData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athletes: Array<TournamentAthleteData>;
  readOnly: boolean;
  tournamentStatus: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  pending: { label: 'Pending', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  complete: { label: 'Complete', variant: 'outline' },
};

export function MatchDetailPanel({
  match,
  open,
  onOpenChange,
  athletes,
  readOnly,
  tournamentStatus,
}: MatchDetailPanelProps) {
  const [redWins, setRedWins] = React.useState(0);
  const [blueWins, setBlueWins] = React.useState(0);
  const [showManualWinner, setShowManualWinner] = React.useState(false);
  const [manualReason, setManualReason] = React.useState('');

  const updateScore = useUpdateScore({ onSuccess: () => onOpenChange(false) });
  const setWinner = useSetWinner({ onSuccess: () => onOpenChange(false) });
  const swapParticipants = useSwapParticipants();

  React.useEffect(() => {
    if (match) {
      setRedWins(match.redWins);
      setBlueWins(match.blueWins);
      setShowManualWinner(false);
      setManualReason('');
    }
  }, [match]);

  if (!match) return null;

  const athleteMap = new Map(athletes.map((a) => [a.id, a]));
  const redAthlete = match.redTournamentAthleteId
    ? athleteMap.get(match.redTournamentAthleteId)
    : null;
  const blueAthlete = match.blueTournamentAthleteId
    ? athleteMap.get(match.blueTournamentAthleteId)
    : null;

  const status = statusConfig[match.status] ?? statusConfig.pending;
  const canEdit = !readOnly && match.status !== 'complete';
  const canSwap =
    !readOnly &&
    (tournamentStatus === 'draft' || tournamentStatus === 'active');
  const hasScoreWinner = redWins >= 2 || blueWins >= 2;
  const scoreDirty = redWins !== match.redWins || blueWins !== match.blueWins;

  function handleSaveScore() {
    if (!match) return;
    updateScore.mutate({ matchId: match.id, redWins, blueWins });
  }

  function handleSetWinner(side: 'red' | 'blue') {
    if (!match) return;
    setWinner.mutate({
      matchId: match.id,
      winnerSide: side,
      reason: manualReason || undefined,
    });
  }

  function handleSwap() {
    if (!match) return;
    swapParticipants.mutate({
      matchId: match.id,
      redTournamentAthleteId: match.blueTournamentAthleteId,
      blueTournamentAthleteId: match.redTournamentAthleteId,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Round {match.round + 1} — Match {match.matchIndex + 1}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Badge variant={status!.variant}>{status!.label}</Badge>
            <span className="text-muted-foreground text-xs">
              Best of {match.bestOf}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-2">
          {/* Participants */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Participants</h4>
              {canSwap && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwap}
                  disabled={swapParticipants.isPending}
                >
                  <ArrowLeftRight className="mr-1 size-3.5" />
                  Swap
                </Button>
              )}
            </div>

            <ParticipantRow
              label="Red"
              athlete={redAthlete}
              isWinner={
                match.winnerId != null && match.winnerId === match.redAthleteId
              }
              colorClass="bg-red-500"
            />
            <ParticipantRow
              label="Blue"
              athlete={blueAthlete}
              isWinner={
                match.winnerId != null && match.winnerId === match.blueAthleteId
              }
              colorClass="bg-blue-500"
            />
          </section>

          <Separator />

          {/* Score */}
          <section className="space-y-3">
            <h4 className="text-sm font-medium">Score</h4>
            <div className="flex items-center justify-center gap-6">
              <ScoreControl
                label="Red"
                value={redWins}
                onChange={setRedWins}
                disabled={!canEdit}
                colorClass="text-red-500"
              />
              <span className="text-muted-foreground text-2xl font-light">
                —
              </span>
              <ScoreControl
                label="Blue"
                value={blueWins}
                onChange={setBlueWins}
                disabled={!canEdit}
                colorClass="text-blue-500"
              />
            </div>

            {hasScoreWinner && (
              <p className="text-center text-xs text-emerald-600">
                Winner:{' '}
                {redWins >= 2
                  ? (redAthlete?.name ?? 'Red')
                  : (blueAthlete?.name ?? 'Blue')}
              </p>
            )}
          </section>

          <Separator />

          {/* Manual Winner Override */}
          {canEdit && !hasScoreWinner && (
            <section className="space-y-3">
              {!showManualWinner ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowManualWinner(true)}
                >
                  <Crown className="mr-1 size-3.5" />
                  Set Winner Manually
                </Button>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Manual Winner</h4>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (optional)</Label>
                    <Input
                      id="reason"
                      placeholder="e.g. Disqualification, injury..."
                      value={manualReason}
                      onChange={(e) => setManualReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-red-500 hover:bg-red-600"
                      onClick={() => handleSetWinner('red')}
                      disabled={!redAthlete || setWinner.isPending}
                    >
                      Red Wins
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                      onClick={() => handleSetWinner('blue')}
                      disabled={!blueAthlete || setWinner.isPending}
                    >
                      Blue Wins
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowManualWinner(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>

        <SheetFooter>
          {canEdit && (
            <Button
              className="w-full"
              onClick={handleSaveScore}
              disabled={!scoreDirty || updateScore.isPending}
            >
              {updateScore.isPending ? 'Saving…' : 'Save Score'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ParticipantRow({
  label: _label,
  athlete,
  isWinner,
  colorClass,
}: {
  label: string;
  athlete: TournamentAthleteData | undefined | null;
  isWinner: boolean;
  colorClass: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border p-2.5',
        isWinner && 'border-emerald-500/40 bg-emerald-500/5'
      )}
    >
      <div className={cn('size-2.5 rounded-full', colorClass)} />
      <div className="min-w-0 flex-1">
        {athlete ? (
          <>
            <p className="truncate text-sm font-medium">{athlete.name}</p>
            <p className="text-muted-foreground text-xs">
              {athlete.affiliation}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm italic">BYE</p>
        )}
      </div>
      {isWinner && <Crown className="size-4 text-emerald-500" />}
    </div>
  );
}

function ScoreControl({
  label,
  value,
  onChange,
  disabled,
  colorClass,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('text-xs font-medium', colorClass)}>{label}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled || value <= 0}
        >
          <Minus className="size-3" />
        </Button>
        <span className="w-8 text-center text-xl font-semibold tabular-nums">
          {value}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onChange(Math.min(2, value + 1))}
          disabled={disabled || value >= 2}
        >
          <Plus className="size-3" />
        </Button>
      </div>
    </div>
  );
}
