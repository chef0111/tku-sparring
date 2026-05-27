import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { MatchData } from '@/features/dashboard/types';
import type { BracketDnDMutationContext } from '@/queries/optimistic-updates/match';
import {
  applyOptimisticAssign,
  applyOptimisticSetLock,
  applyOptimisticSwap,
  applyOptimisticSwapParticipants,
  applyOptimisticUpdateScore,
  findMatchListQueryKey,
} from '@/queries/optimistic-updates/match';
import {
  adminSetMatchStatus,
  assignMatchSlot,
  createCustomMatch,
  deleteMatch,
  generateBracket,
  regenerateBracket,
  resetBracket,
  setMatchLock,
  setMatchWinner,
  shuffleBracket,
  swapMatchParticipants,
  swapMatchSlots,
  updateMatchScore,
} from '@/queries/api/match-api';
import { invalidateAfterMatchWrite } from '@/queries/match/invalidate-match-cache';

function useInvalidateMatches() {
  const queryClient = useQueryClient();
  return () => invalidateAfterMatchWrite(queryClient);
}

export function useGenerateBracket(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: generateBracket,
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useShuffleBracket(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: shuffleBracket,
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
  });
}

export function useRegenerateBracket(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: regenerateBracket,
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onSettled: () => {
      void invalidate();
    },
  });
}

export function useResetBracket(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: resetBracket,
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onSettled: () => {
      void invalidate();
    },
  });
}

export function useCreateCustomMatch(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: createCustomMatch,
    onSuccess: () => {
      invalidate();
      toast.success('Custom match created');
      options?.onSuccess?.();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Request failed'),
  });
}

export function useAssignSlot(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: assignMatchSlot,
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
    mutationFn: swapMatchSlots,
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
    mutationFn: setMatchLock,
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
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: updateMatchScore,
    onMutate: async (input): Promise<BracketDnDMutationContext | undefined> => {
      const queryKey = findMatchListQueryKey(queryClient, input.matchId);
      if (!queryKey) return undefined;

      await queryClient.cancelQueries({ queryKey });
      const previousMatches =
        queryClient.getQueryData<Array<MatchData>>(queryKey);
      queryClient.setQueryData<Array<MatchData>>(queryKey, (old) => {
        if (!old) return old;
        return applyOptimisticUpdateScore(old, input);
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
      if (!error) {
        toast.success('Score updated');
        options?.onSuccess?.();
      }
    },
  });
}

export function useAdminSetMatchStatus(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: adminSetMatchStatus,
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
    mutationFn: updateMatchScore,
    onSuccess: () => {
      invalidate();
      toast.success('Match reset');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteMatch(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: deleteMatch,
    onSuccess: () => {
      invalidate();
      toast.success('Custom match deleted');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useSetWinner(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateMatches();

  return useMutation({
    mutationFn: setMatchWinner,
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
    mutationFn: swapMatchParticipants,
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
