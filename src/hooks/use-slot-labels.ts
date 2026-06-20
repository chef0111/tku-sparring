import * as React from 'react';
import type { MatchData } from '@/contracts/tournament/match';
import type { TournamentAthleteData } from '@/contracts/tournament/division';
import {
  formatFeederWinnerPlaceholder,
  getFeederMatch,
} from '@/server/domain/tournament/arena/match-label';

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

  const cornersSwapped = match.round > 0 && match.cornersSwapped;

  const redEmptyLabel = React.useMemo(() => {
    if (redAssignedName) return '';
    if (match.round === 0) return 'Open';
    const feeder = getFeederMatch(
      matches,
      match.divisionId,
      match.round,
      match.matchIndex,
      'red',
      cornersSwapped
    );
    if (!feeder) return 'Winner pending';
    return formatFeederWinnerPlaceholder(feeder, matchLabel, resolveTaName);
  }, [
    matchLabel,
    match.matchIndex,
    match.round,
    match.divisionId,
    matches,
    redAssignedName,
    resolveTaName,
    cornersSwapped,
  ]);

  const blueEmptyLabel = React.useMemo(() => {
    if (blueAssignedName) return '';
    if (match.round === 0) return 'Open';
    const feeder = getFeederMatch(
      matches,
      match.divisionId,
      match.round,
      match.matchIndex,
      'blue',
      cornersSwapped
    );
    if (!feeder) return 'Winner pending';
    return formatFeederWinnerPlaceholder(feeder, matchLabel, resolveTaName);
  }, [
    matchLabel,
    match.matchIndex,
    match.round,
    match.divisionId,
    matches,
    blueAssignedName,
    resolveTaName,
    cornersSwapped,
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
