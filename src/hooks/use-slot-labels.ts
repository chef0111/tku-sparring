import * as React from 'react';
import type {
  MatchData,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import {
  formatFeederWinnerPlaceholder,
  getFeederMatch,
} from '@/lib/tournament/arena-match-label';

export function useSlotLabels(
  match: MatchData,
  matches: Array<MatchData>,
  athleteMap: Map<string, TournamentAthleteData>,
  matchLabel: ReadonlyMap<string, number | null>
) {
  const resolveTaName = React.useCallback(
    (tournamentAthleteId: string) =>
      athleteMap.get(tournamentAthleteId)?.name ?? null,
    [athleteMap]
  );

  const redAthlete = match.redTournamentAthleteId
    ? athleteMap.get(match.redTournamentAthleteId)
    : null;
  const blueAthlete = match.blueTournamentAthleteId
    ? athleteMap.get(match.blueTournamentAthleteId)
    : null;

  const redAssignedName = React.useMemo(() => {
    if (redAthlete) return redAthlete.name;
    if (!match.redTournamentAthleteId) return null;
    return resolveTaName(match.redTournamentAthleteId) ?? null;
  }, [match.redTournamentAthleteId, redAthlete, resolveTaName]);

  const blueAssignedName = React.useMemo(() => {
    if (blueAthlete) return blueAthlete.name;
    if (!match.blueTournamentAthleteId) return null;
    return resolveTaName(match.blueTournamentAthleteId) ?? null;
  }, [match.blueTournamentAthleteId, blueAthlete, resolveTaName]);

  const redEmptyLabel = React.useMemo(() => {
    if (redAssignedName) return '';
    if (match.round === 0) return 'Open';
    const feeder = getFeederMatch(
      matches,
      match.groupId,
      match.round,
      match.matchIndex,
      'red'
    );
    if (!feeder) return 'Winner pending';
    return formatFeederWinnerPlaceholder(feeder, matchLabel, resolveTaName);
  }, [
    matchLabel,
    match.matchIndex,
    match.round,
    match.groupId,
    matches,
    redAssignedName,
    resolveTaName,
  ]);

  const blueEmptyLabel = React.useMemo(() => {
    if (blueAssignedName) return '';
    if (match.round === 0) return 'Open';
    const feeder = getFeederMatch(
      matches,
      match.groupId,
      match.round,
      match.matchIndex,
      'blue'
    );
    if (!feeder) return 'Winner pending';
    return formatFeederWinnerPlaceholder(feeder, matchLabel, resolveTaName);
  }, [
    matchLabel,
    match.matchIndex,
    match.round,
    match.groupId,
    matches,
    blueAssignedName,
    resolveTaName,
  ]);

  const isRedWinner = React.useMemo(() => {
    return match.winnerId != null && match.winnerId === match.redAthleteId;
  }, [match.winnerId, match.redAthleteId]);

  const isBlueWinner = React.useMemo(() => {
    return match.winnerId != null && match.winnerId === match.blueAthleteId;
  }, [match.winnerId, match.blueAthleteId]);

  return {
    redAthlete,
    blueAthlete,
    redAssignedName,
    blueAssignedName,
    redEmptyLabel,
    blueEmptyLabel,
    isRedWinner,
    isBlueWinner,
  };
}
