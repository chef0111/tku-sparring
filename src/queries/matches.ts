import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  AdminSetMatchStatusDTO,
  AssignSlotDTO,
  GenerateBracketDTO,
  SetLockDTO,
  SetWinnerDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
  UpdateScoreDTO,
} from '@/orpc/matches/dto';
import type { MatchData } from '@/features/dashboard/types';
import type { BracketDnDMutationContext } from '@/lib/queries/matches';
import { client } from '@/orpc/client';
import { invalidateOrpcGroupListQueries } from '@/queries/groups';
import {
  applyOptimisticAssign,
  applyOptimisticSetLock,
  applyOptimisticSwap,
  applyOptimisticSwapParticipants,
  findMatchListQueryKey,
} from '@/lib/queries/matches';

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
    void queryClient.invalidateQueries({ queryKey: ['activity'] });
    void queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === 'advanceSettings',
    });
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
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: AssignSlotDTO) => client.match.assignSlot(data),
    onMutate: async (input): Promise<BracketDnDMutationContext | undefined> => {
      const queryKey = findMatchListQueryKey(queryClient, input.matchId);
      if (!queryKey) return undefined;

      await queryClient.cancelQueries({ queryKey });
      const previousMatches =
        queryClient.getQueryData<Array<MatchData>>(queryKey);
      queryClient.setQueryData<Array<MatchData>>(queryKey, (old) => {
        if (!old) return old;
        return applyOptimisticAssign(old, input);
      });
      return { queryKey, previousMatches };
    },
    onError: (_err, _input, context) => {
      if (context?.queryKey && context.previousMatches !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousMatches);
      }
    },
    onSettled: (_data, error) => {
      void invalidate();
      if (!error) options?.onSuccess?.();
    },
  });
}

export function useSwapSlots(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: SwapSlotsDTO) => client.match.swapSlots(data),
    onMutate: async (input): Promise<BracketDnDMutationContext | undefined> => {
      const queryKey = findMatchListQueryKey(queryClient, input.matchAId);
      if (!queryKey) return undefined;

      await queryClient.cancelQueries({ queryKey });
      const previousMatches =
        queryClient.getQueryData<Array<MatchData>>(queryKey);
      queryClient.setQueryData<Array<MatchData>>(queryKey, (old) => {
        if (!old) return old;
        return applyOptimisticSwap(old, input);
      });
      return { queryKey, previousMatches };
    },
    onError: (_err, _input, context) => {
      if (context?.queryKey && context.previousMatches !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousMatches);
      }
    },
    onSettled: (_data, error) => {
      void invalidate();
      if (!error) options?.onSuccess?.();
    },
  });
}

export function useSetLock(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: SetLockDTO) => client.match.setLock(data),
    onMutate: async (input): Promise<BracketDnDMutationContext | undefined> => {
      const queryKey = findMatchListQueryKey(queryClient, input.matchId);
      if (!queryKey) return undefined;

      await queryClient.cancelQueries({ queryKey });
      const previousMatches =
        queryClient.getQueryData<Array<MatchData>>(queryKey);
      queryClient.setQueryData<Array<MatchData>>(queryKey, (old) => {
        if (!old) return old;
        return applyOptimisticSetLock(old, input);
      });
      return { queryKey, previousMatches };
    },
    onError: (err, _input, context) => {
      if (context?.queryKey && context.previousMatches !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousMatches);
      }
      toast.error(err.message);
    },
    onSettled: (_data, error) => {
      void invalidate();
      if (!error) options?.onSuccess?.();
    },
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

export function useAdminSetMatchStatus(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: AdminSetMatchStatusDTO) =>
      client.match.adminSetMatchStatus(data),
    onSuccess: () => {
      invalidate();
      toast.success('Match status updated');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useResetMatchScore(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: UpdateScoreDTO) => client.match.updateScore(data),
    onSuccess: () => {
      invalidate();
      toast.success('Match reset');
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
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: (data: SwapParticipantsDTO) =>
      client.match.swapParticipants(data),
    onMutate: async (input): Promise<BracketDnDMutationContext | undefined> => {
      const queryKey = findMatchListQueryKey(queryClient, input.matchId);
      if (!queryKey) return undefined;

      await queryClient.cancelQueries({ queryKey });
      const previousMatches =
        queryClient.getQueryData<Array<MatchData>>(queryKey);
      queryClient.setQueryData<Array<MatchData>>(queryKey, (old) => {
        if (!old) return old;
        return applyOptimisticSwapParticipants(old, input);
      });
      return { queryKey, previousMatches };
    },
    onError: (err, _input, context) => {
      if (context?.queryKey && context.previousMatches !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousMatches);
      }
      toast.error(err.message);
    },
    onSettled: (_data, error) => {
      void invalidate();
      if (!error) options?.onSuccess?.();
    },
  });
}
