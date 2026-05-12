import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  AssignSlotDTO,
  GenerateBracketDTO,
  SetLockDTO,
  SetWinnerDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
  UpdateScoreDTO,
} from '@/orpc/matches/matches.dto';
import { client } from '@/orpc/client';
import { invalidateOrpcGroupListQueries } from '@/queries/groups';

export function useMatches(groupId: string | null) {
  return useQuery({
    queryKey: ['match', 'list', groupId] as const,
    queryFn: () => client.match.list({ groupId: groupId! }),
    enabled: !!groupId,
  });
}

export function useTournamentMatches(tournamentId: string) {
  return useQuery({
    queryKey: ['match', 'list', 'tournament', tournamentId] as const,
    queryFn: () => client.match.list({ tournamentId }),
  });
}

function useInvalidateMatches() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['match'] });
    void queryClient.invalidateQueries({ queryKey: ['tournament'] });
    void invalidateOrpcGroupListQueries(queryClient);
  };
}

export function useGenerateBracket(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: GenerateBracketDTO) => client.bracket.generate(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useShuffleBracket(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: { groupId: string }) => client.bracket.shuffle(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useRegenerateBracket(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: { groupId: string }) => client.bracket.regenerate(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useResetBracket(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: { groupId: string }) => client.bracket.reset(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useAssignSlot(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: AssignSlotDTO) => client.match.assignSlot(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useSwapSlots(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: SwapSlotsDTO) => client.match.swapSlots(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useSetLock(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: SetLockDTO) => client.match.setLock(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateScore(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: UpdateScoreDTO) => client.match.updateScore(data),
    onSuccess: () => {
      invalidate();
      toast.success('Score updated');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useSetWinner(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: SetWinnerDTO) => client.match.setWinner(data),
    onSuccess: () => {
      invalidate();
      toast.success('Winner set');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useSwapParticipants(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: SwapParticipantsDTO) =>
      client.match.swapParticipants(data),
    onSuccess: () => {
      invalidate();
      toast.success('Participants swapped');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}
