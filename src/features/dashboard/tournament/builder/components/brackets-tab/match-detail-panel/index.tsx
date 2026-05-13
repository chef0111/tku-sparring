import * as React from 'react';
import { ArrowLeftRight, Crown } from 'lucide-react';
import { SlotLocks } from './slot-locks';
import { MatchSheetStatus } from './match-sheet-status';
import { ParticipantRow } from './participant-row';
import { ScoreControl } from './score-control';
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
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  useSetLock,
  useSetWinner,
  useSwapParticipants,
  useUpdateScore,
} from '@/queries/matches';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';

export interface MatchDetailPanelProps {
  match: MatchData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athletes: Array<TournamentAthleteData>;
  readOnly: boolean;
  tournamentStatus: string;
  maxBracketRound: number;
}

export function MatchDetailPanel({
  match,
  open,
  onOpenChange,
  athletes,
  readOnly,
  tournamentStatus,
  maxBracketRound,
}: MatchDetailPanelProps) {
  const [redWins, setRedWins] = React.useState(0);
  const [blueWins, setBlueWins] = React.useState(0);
  const [showManualWinner, setShowManualWinner] = React.useState(false);
  const [manualReason, setManualReason] = React.useState('');

  const updateScore = useUpdateScore({ onSuccess: () => onOpenChange(false) });
  const setWinner = useSetWinner({ onSuccess: () => onOpenChange(false) });
  const swapParticipants = useSwapParticipants();
  const setLock = useSetLock();

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

  const canEdit = !readOnly && match.status !== 'complete';
  const canSwap =
    !readOnly &&
    (tournamentStatus === 'draft' || tournamentStatus === 'active');
  const canToggleLocks =
    !readOnly &&
    (tournamentStatus === 'draft' || tournamentStatus === 'active');
  const hasScoreWinner = redWins >= 2 || blueWins >= 2;
  const scoreDirty = redWins !== match.redWins || blueWins !== match.blueWins;

  const roundLabel = getBracketRoundLabel(
    match.round,
    Math.max(maxBracketRound, match.round)
  );

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

  function handleLockChange(side: 'red' | 'blue', locked: boolean) {
    if (!match) return;
    setLock.mutate({ matchId: match.id, side, locked });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="gap-2 border-b px-6 pt-6 pb-4">
          <SheetTitle>
            {roundLabel} — Match {match.matchIndex + 1}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <MatchSheetStatus status={match.status} />
            <span className="text-muted-foreground text-xs">
              Best of {match.bestOf}
            </span>
            {match.redLocked || match.blueLocked ? (
              <span className="text-muted-foreground text-xs">
                {match.redLocked && match.blueLocked
                  ? 'Both athletes locked'
                  : match.redLocked
                    ? 'Red locked'
                    : 'Blue locked'}
              </span>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-4">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Participants</h4>
              {canSwap ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwap}
                  disabled={swapParticipants.isPending}
                >
                  <ArrowLeftRight data-icon="inline-start" />
                  Swap
                </Button>
              ) : null}
            </div>

            <ParticipantRow
              label="Red"
              athlete={redAthlete}
              isWinner={
                match.winnerId != null && match.winnerId === match.redAthleteId
              }
              dotClassName="bg-destructive"
            />
            <ParticipantRow
              label="Blue"
              athlete={blueAthlete}
              isWinner={
                match.winnerId != null && match.winnerId === match.blueAthleteId
              }
              dotClassName="bg-blue-500"
            />
          </section>

          {canToggleLocks && (
            <SlotLocks
              matchId={match.id}
              redLocked={match.redLocked}
              blueLocked={match.blueLocked}
              isPending={setLock.isPending}
              onLockChange={handleLockChange}
            />
          )}

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Score</h4>
            <div className="flex items-center justify-center gap-6">
              <ScoreControl
                label="Red"
                value={redWins}
                onChange={setRedWins}
                disabled={!canEdit}
              />
              <Separator
                orientation="horizontal"
                className="bg-muted-foreground mt-4 min-h-0.5 max-w-8"
              />
              <ScoreControl
                label="Blue"
                value={blueWins}
                onChange={setBlueWins}
                disabled={!canEdit}
              />
            </div>

            {hasScoreWinner ? (
              <p className="text-primary text-center text-xs font-medium">
                Winner:{' '}
                {redWins >= 2
                  ? (redAthlete?.name ?? 'Red')
                  : (blueAthlete?.name ?? 'Blue')}
              </p>
            ) : null}
          </section>

          <Separator />

          {canEdit && !hasScoreWinner ? (
            <section className="flex flex-col gap-3">
              {!showManualWinner ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowManualWinner(true)}
                >
                  <Crown data-icon="inline-start" />
                  Set winner manually
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-medium">Manual winner</h4>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="match-detail-reason">
                        Reason (optional)
                      </FieldLabel>
                      <Input
                        id="match-detail-reason"
                        placeholder="e.g. Disqualification, injury…"
                        value={manualReason}
                        onChange={(e) => setManualReason(e.target.value)}
                      />
                    </Field>
                  </FieldGroup>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive! flex-1"
                      onClick={() => handleSetWinner('red')}
                      disabled={!redAthlete || setWinner.isPending}
                    >
                      Red wins
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-blue-500!"
                      onClick={() => handleSetWinner('blue')}
                      disabled={!blueAthlete || setWinner.isPending}
                    >
                      Blue wins
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
          ) : null}
        </div>

        <SheetFooter className="mt-auto border-t px-6 py-4">
          {canEdit ? (
            <Button
              className="w-full"
              onClick={handleSaveScore}
              disabled={!scoreDirty || updateScore.isPending}
            >
              {updateScore.isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Saving…
                </>
              ) : (
                'Save score'
              )}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
