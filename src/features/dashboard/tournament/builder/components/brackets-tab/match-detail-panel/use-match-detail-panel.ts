import * as React from 'react';
import type { TournamentAthleteData } from '@/features/dashboard/types';
import { useTournamentBracket } from '@/features/dashboard/tournament/builder/context/tournament-bracket/use-tournament-bracket';
import {
  useSetLock,
  useSetWinner,
  useSwapParticipants,
  useUpdateScore,
} from '@/queries/matches';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';

export function useMatchDetailPanel() {
  const {
    matchLabel,
    matchForDetailPanel: match,
    panelOpen: open,
    setPanelOpen: onOpenChange,
    athletes,
    readOnly,
    tournamentStatus,
    maxBracketRound,
  } = useTournamentBracket();

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

  const athleteMap = React.useMemo(() => {
    const map = new Map<string, TournamentAthleteData>();
    for (const a of athletes) {
      map.set(a.id, a);
    }
    return map;
  }, [athletes]);

  const redAthlete = match?.redTournamentAthleteId
    ? athleteMap.get(match.redTournamentAthleteId)
    : null;
  const blueAthlete = match?.blueTournamentAthleteId
    ? athleteMap.get(match.blueTournamentAthleteId)
    : null;

  const canEdit = !!match && !readOnly && match.status !== 'complete';
  const canSwap =
    !!match &&
    !readOnly &&
    (tournamentStatus === 'draft' || tournamentStatus === 'active');
  const canToggleLocks =
    !!match &&
    !readOnly &&
    (tournamentStatus === 'draft' || tournamentStatus === 'active');

  const hasScoreWinner = redWins >= 2 || blueWins >= 2;
  const scoreDirty =
    !!match && (redWins !== match.redWins || blueWins !== match.blueWins);

  const roundLabel = React.useMemo(() => {
    if (!match) return '';
    return getBracketRoundLabel(
      match.round,
      Math.max(maxBracketRound, match.round)
    );
  }, [match, maxBracketRound]);

  const handleSaveScore = React.useCallback(() => {
    if (!match) return;
    updateScore.mutate({ matchId: match.id, redWins, blueWins });
  }, [match, redWins, blueWins, updateScore]);

  const handleSetWinner = React.useCallback(
    (side: 'red' | 'blue') => {
      if (!match) return;
      setWinner.mutate({
        matchId: match.id,
        winnerSide: side,
        reason: manualReason || undefined,
      });
    },
    [match, manualReason, setWinner]
  );

  const handleSwap = React.useCallback(() => {
    if (!match) return;
    swapParticipants.mutate({
      matchId: match.id,
      redTournamentAthleteId: match.blueTournamentAthleteId,
      blueTournamentAthleteId: match.redTournamentAthleteId,
    });
  }, [match, swapParticipants]);

  const handleLockChange = React.useCallback(
    (side: 'red' | 'blue', locked: boolean) => {
      if (!match) return;
      setLock.mutate({ matchId: match.id, side, locked });
    },
    [match, setLock]
  );

  return {
    match,
    matchLabel,
    open,
    onOpenChange,
    redWins,
    setRedWins,
    blueWins,
    setBlueWins,
    showManualWinner,
    setShowManualWinner,
    manualReason,
    setManualReason,
    redAthlete,
    blueAthlete,
    canEdit,
    canSwap,
    canToggleLocks,
    hasScoreWinner,
    scoreDirty,
    roundLabel,
    handleSaveScore,
    handleSetWinner,
    handleSwap,
    handleLockChange,
    updateScore,
    swapParticipants,
    setWinner,
    setLock,
  };
}
