import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useArenaMutation } from '@/features/app/hooks/use-arena-mutation';
import { useSettings } from '@/contexts/settings';
import { useMatchStore } from '@/stores/match-store';
import { usePlayerStore } from '@/stores/player-store';
import { useTimerStore } from '@/stores/timer-store';
import { useDeviceId } from '@/hooks/use-device-id';

export function useFinishMatch() {
  const { mutateAsync } = useArenaMutation();
  const deviceId = useDeviceId();

  const closeMatchResult = useMatchStore((s) => s.closeMatchResult);
  const resetMatch = useMatchStore((s) => s.resetMatch);
  const resetTimer = useTimerStore((s) => s.reset);
  const resetPlayers = usePlayerStore((s) => s.resetAll);

  const { redWon, blueWon, matchWinner, matchId } = useMatchStore(
    useShallow((s) => ({
      redWon: s.redWon,
      blueWon: s.blueWon,
      matchWinner: s.matchWinner,
      matchId: s.matchId,
    }))
  );

  const { formData, updateAdvanceForm, setActiveTab, setIsOpen } =
    useSettings();
  const selectedMatchId = formData.advance.match ?? matchId;

  const accept = React.useCallback(async () => {
    if (!selectedMatchId || !matchWinner || matchWinner === 'tie') {
      return;
    }

    await mutateAsync({
      kind: 'match.updateScore',
      payload: {
        matchId: selectedMatchId,
        redWins: redWon,
        blueWins: blueWon,
      },
    });

    await mutateAsync({
      kind: 'match.setWinner',
      payload: {
        matchId: selectedMatchId,
        winnerSide: matchWinner,
        reason: 'arena-finalized',
      },
    });

    if (deviceId) {
      await mutateAsync({
        kind: 'device.lastSelection.set',
        payload: {
          deviceId,
          tournamentId: formData.advance.tournament,
          groupId: formData.advance.group,
          matchId: null,
        },
      });
    }

    closeMatchResult();
    resetMatch();
    resetTimer();
    resetPlayers();
    updateAdvanceForm({
      match: null,
      matchLabel: null,
    });
    setActiveTab('advance');
    setIsOpen(true);
  }, [
    closeMatchResult,
    deviceId,
    formData.advance.group,
    formData.advance.tournament,
    matchWinner,
    mutateAsync,
    redWon,
    blueWon,
    resetMatch,
    resetPlayers,
    resetTimer,
    selectedMatchId,
    setActiveTab,
    setIsOpen,
    updateAdvanceForm,
  ]);

  const cancel = React.useCallback(() => {
    closeMatchResult();
  }, [closeMatchResult]);

  return { accept, cancel };
}
