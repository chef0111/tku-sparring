import { ArrowLeftRight, Crown, RotateCcw } from 'lucide-react';
import { SlotLocks } from './slot-locks';
import { MatchSheetStatus } from './match-sheet-status';
import { ParticipantRow } from './participant-row';
import { ScoreControl } from './score-control';
import { useMatchDetailPanel } from './use-match-detail-panel';
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

export function MatchDetailPanel() {
  const position = useMatchDetailPanel();
  if (!position.match) return null;

  const { match, matchLabel } = position;

  return (
    <Sheet
      open={position.open}
      onOpenChange={position.onOpenChange}
      modal={false}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="gap-2 border-b px-6 pt-6 pb-4">
          <SheetTitle>
            {position.roundLabel} — Match {matchLabel.get(match.id)}
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
              {position.canSwap ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={position.handleSwap}
                  disabled={position.swapParticipants.isPending}
                >
                  <ArrowLeftRight data-icon="inline-start" />
                  Swap
                </Button>
              ) : null}
            </div>

            <ParticipantRow
              label="Red"
              athlete={position.redAthlete}
              isWinner={
                match.winnerId != null && match.winnerId === match.redAthleteId
              }
              dotClassName="bg-destructive"
            />
            <ParticipantRow
              label="Blue"
              athlete={position.blueAthlete}
              isWinner={
                match.winnerId != null && match.winnerId === match.blueAthleteId
              }
              dotClassName="bg-blue-500"
            />
          </section>

          {position.canToggleLocks && (
            <SlotLocks
              matchId={match.id}
              redLocked={match.redLocked}
              blueLocked={match.blueLocked}
              isPending={position.setLock.isPending}
              onLockChange={position.handleLockChange}
            />
          )}

          <Separator />

          <section className="flex flex-col gap-3">
            <h4 className="text-sm font-medium">Score</h4>
            <div className="flex items-center justify-center gap-6">
              <ScoreControl
                label="Red"
                value={position.redWins}
                onChange={position.setRedWins}
                disabled={!position.canEdit}
              />
              <Separator
                orientation="horizontal"
                className="bg-muted-foreground mt-4 min-h-0.5 max-w-8"
              />
              <ScoreControl
                label="Blue"
                value={position.blueWins}
                onChange={position.setBlueWins}
                disabled={!position.canEdit}
              />
            </div>

            {position.hasScoreWinner ? (
              <p className="text-primary text-center text-xs font-medium">
                Winner:{' '}
                {position.redWins >= 2
                  ? (position.redAthlete?.name ?? 'Red')
                  : (position.blueAthlete?.name ?? 'Blue')}
              </p>
            ) : null}
          </section>

          <Separator />

          {position.canEdit && !position.hasScoreWinner ? (
            <section className="flex flex-col gap-3">
              {!position.showManualWinner ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => position.setShowManualWinner(true)}
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
                        value={position.manualReason}
                        onChange={(e) =>
                          position.setManualReason(e.target.value)
                        }
                      />
                    </Field>
                  </FieldGroup>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive! flex-1"
                      onClick={() => position.handleSetWinner('red')}
                      disabled={
                        !position.redAthlete || position.setWinner.isPending
                      }
                    >
                      Red wins
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-blue-500!"
                      onClick={() => position.handleSetWinner('blue')}
                      disabled={
                        !position.blueAthlete || position.setWinner.isPending
                      }
                    >
                      Blue wins
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => position.setShowManualWinner(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </section>
          ) : null}
        </div>

        <SheetFooter className="mt-auto border-t px-6 py-4">
          {position.canEdit ? (
            <Button
              className="w-full"
              onClick={position.handleSaveScore}
              disabled={!position.scoreDirty || position.updateScore.isPending}
            >
              {position.updateScore.isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Saving…
                </>
              ) : (
                'Save score'
              )}
            </Button>
          ) : (
            !!position.canResetMatch && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive! border-destructive/50 hover:bg-destructive/10 w-full"
                onClick={position.handleResetMatch}
                disabled={position.resetMatchScore.isPending}
              >
                {position.resetMatchScore.isPending ? (
                  <>
                    <Spinner className="text-destructive" />
                    Resetting…
                  </>
                ) : (
                  <>
                    <RotateCcw />
                    Reset match
                  </>
                )}
              </Button>
            )
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
