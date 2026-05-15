import { useCallback, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { useQueryClient } from '@tanstack/react-query';
import { SettingsContext, defaultFormData } from './context';
import type { ReactNode } from 'react';
import type {
  AdvanceFormData,
  FormData,
  FormState,
  StandardFormData,
} from './context';
import { usePlayerStore } from '@/stores/player-store';
import { useTimerStore } from '@/stores/timer-store';
import { useMatchStore } from '@/stores/match-store';
import { useDeviceId } from '@/hooks/use-device-id';
import { arenaSelectionMatchesQueryOptions } from '@/features/app/hooks/use-arena-selection-view';

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const deviceId = useDeviceId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'standard' | 'advance'>(
    'standard'
  );
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [standardFormState, setStandardFormStateInternal] = useState<FormState>(
    {
      isDirty: false,
      isValid: true,
    }
  );
  const [advanceFormState, setAdvanceFormStateInternal] = useState<FormState>({
    isDirty: false,
    isValid: true,
  });

  const formState =
    activeTab === 'standard' ? standardFormState : advanceFormState;

  const setMaxHealth = usePlayerStore((s) => s.setMaxHealth);
  const resetAll = usePlayerStore((s) => s.resetAll);
  const setPlayerName = usePlayerStore((s) => s.setPlayerName);
  const setPlayerAvatar = usePlayerStore((s) => s.setPlayerAvatar);

  const { setRoundDuration, setBreakDuration, resetRoundStats } = useTimerStore(
    useShallow((s) => ({
      setRoundDuration: s.setRoundDuration,
      setBreakDuration: s.setBreakDuration,
      resetRoundStats: s.resetRoundStats,
    }))
  );
  const resetMatch = useMatchStore((s) => s.resetMatch);

  const toggleSettings = useCallback(() => setIsOpen(true), []);

  const updateStandardForm = useCallback((data: Partial<StandardFormData>) => {
    setFormData((prev) => ({
      ...prev,
      standard: { ...prev.standard, ...data },
    }));
  }, []);

  const updateAdvanceForm = useCallback((data: Partial<AdvanceFormData>) => {
    setFormData((prev) => ({
      ...prev,
      advance: { ...prev.advance, ...data },
    }));
  }, []);

  const setStandardFormState = useCallback((state: Partial<FormState>) => {
    setStandardFormStateInternal((prev) => ({ ...prev, ...state }));
  }, []);

  const setAdvanceFormState = useCallback((state: Partial<FormState>) => {
    setAdvanceFormStateInternal((prev) => ({ ...prev, ...state }));
  }, []);

  const applySettings = useCallback(() => {
    // Standard and Advance tabs are completely independent
    if (activeTab === 'standard') {
      const { standard } = formData;

      if (standard.maxHealth > 0) {
        setMaxHealth(standard.maxHealth);
      }
      if (standard.roundDuration > 0) {
        setRoundDuration(standard.roundDuration * 1000);
      }
      if (standard.breakDuration > 0) {
        setBreakDuration(standard.breakDuration * 1000);
      }
      if (standard.redPlayerName) {
        setPlayerName('red', standard.redPlayerName);
      }
      if (standard.bluePlayerName) {
        setPlayerName('blue', standard.bluePlayerName);
      }
      if (standard.redPlayerAvatar) {
        setPlayerAvatar('red', standard.redPlayerAvatar);
      }
      if (standard.bluePlayerAvatar) {
        setPlayerAvatar('blue', standard.bluePlayerAvatar);
      }

      resetRoundStats(standard.roundDuration * 1000);
    } else {
      const { advance } = formData;

      if (advance.maxHealth > 0) {
        setMaxHealth(advance.maxHealth);
      }
      if (advance.roundDuration > 0) {
        setRoundDuration(advance.roundDuration * 1000);
      }
      if (advance.breakDuration > 0) {
        setBreakDuration(advance.breakDuration * 1000);
      }
      if (advance.redPlayerName) {
        setPlayerName('red', advance.redPlayerName);
      }
      if (advance.bluePlayerName) {
        setPlayerName('blue', advance.bluePlayerName);
      }
      if (advance.redPlayerAvatar) {
        setPlayerAvatar('red', advance.redPlayerAvatar);
      }
      if (advance.bluePlayerAvatar) {
        setPlayerAvatar('blue', advance.bluePlayerAvatar);
      }

      resetRoundStats(advance.roundDuration * 1000);

      if (advance.match) {
        let label = advance.matchLabel?.trim() ?? '';
        if (!label && advance.tournament && advance.group && deviceId) {
          const cached = queryClient.getQueryData(
            arenaSelectionMatchesQueryOptions({
              deviceId,
              tournamentId: advance.tournament,
              groupId: advance.group,
            }).queryKey
          ) as { matches: Array<{ id: string; label: string }> } | undefined;
          label =
            cached?.matches
              ?.find((m) => m.id === advance.match)
              ?.label?.trim() ?? '';
        }
        if (!label) {
          label =
            advance.match.length > 8
              ? `Match ${advance.match.slice(-6)}`
              : advance.match;
        }
        useMatchStore.getState().setMatchDisplay({
          id: advance.match,
          label,
        });
      }
    }

    resetMatch();
    resetAll();

    toast.success('Settings applied', {
      description: 'Applied latest settings for the next matches.',
      className: 'min-w-8! mx-auto inset-x-0 justify-center',
      position: 'top-center',
    });

    setIsOpen(false);
  }, [
    activeTab,
    deviceId,
    formData,
    queryClient,
    setMaxHealth,
    setRoundDuration,
    setBreakDuration,
    setPlayerName,
    setPlayerAvatar,
    resetMatch,
    resetAll,
    resetRoundStats,
  ]);

  useHotkeys(
    'mod+comma',
    (e) => {
      e.preventDefault();
      toggleSettings();
    },
    [toggleSettings]
  );

  useHotkeys(
    'mod+enter',
    (e) => {
      e.preventDefault();

      const isConfirmDisabled = !formState.isDirty || !formState.isValid;

      if (isConfirmDisabled) return;

      applySettings();
    },
    { enabled: isOpen, enableOnFormTags: true },
    [applySettings, isOpen]
  );

  const contextValue = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      toggleSettings,
      activeTab,
      setActiveTab,
      formData,
      formState,
      updateStandardForm,
      updateAdvanceForm,
      setStandardFormState,
      setAdvanceFormState,
      applySettings,
    }),
    [
      isOpen,
      toggleSettings,
      activeTab,
      formData,
      formState,
      updateStandardForm,
      updateAdvanceForm,
      setStandardFormState,
      setAdvanceFormState,
      applySettings,
    ]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
