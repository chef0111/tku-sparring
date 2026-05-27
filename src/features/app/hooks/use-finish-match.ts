import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useQueryClient } from '@tanstack/react-query';

import { useArenaMutation } from '@/features/app/hooks/use-arena-mutation';
import { useSettings } from '@/contexts/settings';
import { useMatchStore } from '@/stores/match-store';
import { afterFinish } from '@/stores/arena-scoring-actions';
import { invalidateAdvanceSettingsQueries } from '@/queries/advance-settings/invalidate-advance-settings-cache';
import { advanceSettingsKeys } from '@/queries/keys';

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export function useFinishMatch() {
  const queryClient = useQueryClient();
  const { mutateAsync } = useArenaMutation();

  const { matchId } = useMatchStore(
    useShallow((s) => ({
      matchId: s.matchId,
    }))
  );

  const { formData } = useSettings();
  const selectedMatchId = formData.advance.match ?? matchId;

  const invalidateAdvanceSelection = React.useCallback(() => {
    const tournamentId = formData.advance.tournament;
    if (tournamentId) {
      void invalidateAdvanceSettingsQueries(queryClient, tournamentId);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: advanceSettingsKeys.all });
  }, [queryClient, formData.advance.tournament]);

  const resetArenaClientAfterResult = React.useCallback(() => {
    afterFinish();
  }, []);

  const accept = React.useCallback(() => {
    resetArenaClientAfterResult();
    invalidateAdvanceSelection();
  }, [invalidateAdvanceSelection, resetArenaClientAfterResult]);

  const cancel = React.useCallback(async () => {
    if (selectedMatchId && OBJECT_ID_RE.test(selectedMatchId)) {
      await mutateAsync({
        kind: 'match.updateScore',
        payload: {
          matchId: selectedMatchId,
          redWins: 0,
          blueWins: 0,
        },
      });
    }
    resetArenaClientAfterResult();
    invalidateAdvanceSelection();
  }, [
    invalidateAdvanceSelection,
    mutateAsync,
    resetArenaClientAfterResult,
    selectedMatchId,
  ]);

  return { accept, cancel };
}
