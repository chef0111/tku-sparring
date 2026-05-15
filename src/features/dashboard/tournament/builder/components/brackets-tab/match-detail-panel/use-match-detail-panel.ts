import * as React from 'react';
import type {
  MatchStatus,
  TournamentAthleteData,
} from '@/features/dashboard/types';
import { useTournamentBracket } from '@/features/dashboard/tournament/builder/context/tournament-bracket/use-tournament-bracket';
import {
  useAdminSetMatchStatus,
  useResetMatchScore,
  useSetLock,
  useSetWinner,
  useSwapParticipants,
  useUpdateScore,
} from '@/queries/matches';
import { getBracketRoundLabel } from '@/lib/tournament/bracket-round-label';

const MATCH_STATUS_RANK: Record<MatchStatus, number> = {
  pending: 0,
  active: 1,
  complete: 2,
};

function isMatchStatusDowngrade(from: MatchStatus, to: MatchStatus) {
  return MATCH_STATUS_RANK[to] < MATCH_STATUS_RANK[from];
}

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
  const [pendingMatchStatus, setPendingMatchStatus] =
    React.useState<MatchStatus | null>(null);

  const updateScore = useUpdateScore({ onSuccess: () => onOpenChange(false) });
  const resetMatchScore = useResetMatchScore();
  const setWinner = useSetWinner({ onSuccess: () => onOpenChange(false) });
  const swapParticipants = useSwapParticipants();
  const setLock = useSetLock();
  const adminSetMatchStatus = useAdminSetMatchStatus({
    onSuccess: () => setPendingMatchStatus(null),
  });

  React.useEffect(() => {
    if (match) {
      setRedWins(match.redWins);
      setBlueWins(match.blueWins);
      setShowManualWinner(false);
      setManualReason('');
      setPendingMatchStatus(null);
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
  const canResetMatch =
    !!match &&
    !readOnly &&
    (tournamentStatus === 'draft' || tournamentStatus === 'active') &&
    (match.redWins > 0 ||
      match.blueWins > 0 ||
      match.status === 'complete' ||
      match.winnerId != null);
  const canSwap =
    !!match &&
    !readOnly &&
    (tournamentStatus === 'draft' || tournamentStatus === 'active');
  const canToggleLocks =
    !!match &&
    !readOnly &&
    (tournamentStatus === 'draft' || tournamentStatus === 'active');

  const canChangeMatchStatus =
    !!match &&
    !readOnly &&
    (tournamentStatus === 'draft' || tournamentStatus === 'active');

  const hasScoreWinner = redWins >= 2 || blueWins >= 2;
  const hasCompletedWinner =
    !!match &&
    match.status === 'complete' &&
    (match.winnerTournamentAthleteId != null || match.winnerId != null);
  const showWinnerSummary = hasScoreWinner || hasCompletedWinner;

  const winnerSummaryName = React.useMemo(() => {
    if (!match) return '';
    if (hasScoreWinner) {
      return redWins >= 2
        ? (redAthlete?.name ?? 'Red')
        : (blueAthlete?.name ?? 'Blue');
    }
    if (match.winnerTournamentAthleteId === match.redTournamentAthleteId) {
      return redAthlete?.name ?? 'Red';
    }
    if (match.winnerTournamentAthleteId === match.blueTournamentAthleteId) {
      return blueAthlete?.name ?? 'Blue';
    }
    if (match.winnerId && match.winnerId === match.redAthleteId) {
      return redAthlete?.name ?? 'Red';
    }
    if (match.winnerId && match.winnerId === match.blueAthleteId) {
      return blueAthlete?.name ?? 'Blue';
    }
    return 'Winner';
  }, [match, hasScoreWinner, redWins, blueWins, redAthlete, blueAthlete]);

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

  const handleResetMatch = React.useCallback(() => {
    if (!match) return;
    resetMatchScore.mutate(
      { matchId: match.id, redWins: 0, blueWins: 0 },
      {
        onSuccess: () => {
          setRedWins(0);
          setBlueWins(0);
          setShowManualWinner(false);
          setManualReason('');
        },
      }
    );
  }, [match, resetMatchScore]);

  const handleMatchStatusSelect = React.useCallback(
    (next: MatchStatus) => {
      if (!match || next === match.status) return;
      if (isMatchStatusDowngrade(match.status, next)) {
        setPendingMatchStatus(next);
        return;
      }
      adminSetMatchStatus.mutate({ matchId: match.id, status: next });
    },
    [adminSetMatchStatus, match]
  );

  const confirmPendingMatchStatus = React.useCallback(() => {
    if (!match || !pendingMatchStatus) return;
    adminSetMatchStatus.mutate({
      matchId: match.id,
      status: pendingMatchStatus,
    });
  }, [adminSetMatchStatus, match, pendingMatchStatus]);

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
    canResetMatch,
    canSwap,
    canToggleLocks,
    canChangeMatchStatus,
    pendingMatchStatus,
    setPendingMatchStatus,
    handleMatchStatusSelect,
    confirmPendingMatchStatus,
    hasScoreWinner,
    showWinnerSummary,
    winnerSummaryName,
    scoreDirty,
    roundLabel,
    handleSaveScore,
    handleSetWinner,
    handleSwap,
    handleLockChange,
    handleResetMatch,
    updateScore,
    resetMatchScore,
    swapParticipants,
    setWinner,
    setLock,
    adminSetMatchStatus,
  };
}
