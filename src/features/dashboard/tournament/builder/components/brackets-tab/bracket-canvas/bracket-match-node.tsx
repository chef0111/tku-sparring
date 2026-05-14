import * as React from 'react';
import { useTournamentBracket } from '../../../context/tournament-bracket/use-tournament-bracket';
import { BracketSlot } from './bracket-slot';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import type { MatchPosition } from '@/lib/tournament/bracket-layout';
import {
  ATHLETE_ROW_H,
  MATCH_H,
  MATCH_W,
} from '@/lib/tournament/bracket-layout';
import {
  formatFeederWinnerLabel,
  getFeederMatch,
} from '@/lib/tournament/arena-match-label';
import { cn } from '@/lib/utils';
import { useSetLock } from '@/queries/matches';

interface BracketMatchNodeProps {
  pos: MatchPosition;
  matches: Array<MatchData>;
  athleteMap: Map<string, TournamentAthleteData>;
}

export function BracketMatchNode({
  pos,
  matches,
  athleteMap,
}: BracketMatchNodeProps) {
  const { matchLabel, handleSlotClick, readOnly } = useTournamentBracket();
  const { match } = pos;
  const setLock = useSetLock();

  const redAthlete = match.redTournamentAthleteId
    ? athleteMap.get(match.redTournamentAthleteId)
    : null;
  const blueAthlete = match.blueTournamentAthleteId
    ? athleteMap.get(match.blueTournamentAthleteId)
    : null;

  const redEmptyLabel = React.useMemo(() => {
    if (redAthlete) return '';
    if (match.round === 0) return 'Open';
    const feeder = getFeederMatch(
      matches,
      match.round,
      match.matchIndex,
      'red'
    );
    const n = feeder ? matchLabel.get(feeder.id) : undefined;
    return n != null ? formatFeederWinnerLabel(n) : 'Winner pending';
  }, [matchLabel, match.matchIndex, match.round, matches, redAthlete]);

  const blueEmptyLabel = React.useMemo(() => {
    if (blueAthlete) return '';
    if (match.round === 0) return 'Open';
    const feeder = getFeederMatch(
      matches,
      match.round,
      match.matchIndex,
      'blue'
    );
    const n = feeder ? matchLabel.get(feeder.id) : undefined;
    return n != null ? formatFeederWinnerLabel(n) : 'Winner pending';
  }, [matchLabel, match.matchIndex, match.round, matches, blueAthlete]);

  const isRedWinner =
    match.winnerId != null && match.winnerId === match.redAthleteId;
  const isBlueWinner =
    match.winnerId != null && match.winnerId === match.blueAthleteId;

  const statusBorder: Record<string, string> = {
    pending: 'border-border',
    active: 'border-blue-500',
    complete: 'border-emerald-500',
  };

  function toggleRed() {
    setLock.mutate({
      matchId: match.id,
      side: 'red',
      locked: !match.redLocked,
    });
  }
  function toggleBlue() {
    setLock.mutate({
      matchId: match.id,
      side: 'blue',
      locked: !match.blueLocked,
    });
  }

  return (
    <div
      className="absolute z-1 overflow-visible"
      style={{ left: pos.x, top: pos.y, width: MATCH_W, height: MATCH_H }}
    >
      <p className="text-muted-foreground pointer-events-none absolute -top-4 right-0 left-0 truncate text-center text-[10px] leading-none font-medium tabular-nums">
        Match {matchLabel.get(match.id)}
      </p>
      <div
        className={cn(
          'bg-card pointer-events-none absolute inset-0 rounded-md border',
          statusBorder[match.status] ?? statusBorder.pending
        )}
      />
      {isRedWinner && (
        <div
          className="pointer-events-none absolute top-px right-px left-px rounded-t-[5px] bg-emerald-500/10"
          style={{ height: ATHLETE_ROW_H - 1 }}
        />
      )}
      {isBlueWinner && (
        <div
          className="pointer-events-none absolute right-px left-px rounded-b-[5px] bg-emerald-500/10"
          style={{
            top: ATHLETE_ROW_H,
            height: ATHLETE_ROW_H - 1,
          }}
        />
      )}
      <div className="bg-border pointer-events-none absolute top-1/2 right-0 left-0 h-px -translate-y-1/2" />

      <BracketSlot
        match={match}
        side="red"
        athlete={redAthlete}
        emptyLabel={redEmptyLabel}
        locked={match.redLocked}
        wins={match.redWins}
        isWinner={isRedWinner}
        onSlotClick={handleSlotClick}
        onToggleLock={toggleRed}
        readOnly={readOnly}
      />
      <BracketSlot
        match={match}
        side="blue"
        athlete={blueAthlete}
        emptyLabel={blueEmptyLabel}
        locked={match.blueLocked}
        wins={match.blueWins}
        isWinner={isBlueWinner}
        onSlotClick={handleSlotClick}
        onToggleLock={toggleBlue}
        readOnly={readOnly}
      />
    </div>
  );
}
