import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  BulkAddAthletesDTO,
  BulkRemoveTournamentAthletesDTO,
  UpdateTournamentAthleteDTO,
} from '@/orpc/tournament-athletes/dto';
import {
  bulkAddTournamentAthletes,
  bulkRemoveTournamentAthletes,
  removeTournamentAthlete,
  updateTournamentAthlete,
} from '@/queries/api/tournament-athlete-api';
import {
  invalidateOnBulkAdd,
  invalidateOnRemove,
  invalidateTournamentAthleteQueries,
} from '@/queries/tournament-athlete/invalidate-tournament-athlete-cache';

function useInvalidateTournamentAthletes() {
  const queryClient = useQueryClient();
  return () => invalidateTournamentAthleteQueries(queryClient);
}

export function useBulkAddAthletes(options?: {
  onSuccess?: (result: {
    added: number;
    assigned: number;
    unassigned: number;
  }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkAddAthletesDTO) => bulkAddTournamentAthletes(data),
    onSuccess: (result, variables) => {
      invalidateOnBulkAdd(queryClient, variables);
      options?.onSuccess?.(result);
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateTournamentAthlete(options?: {
  onSuccess?: () => void;
}) {
  const invalidate = useInvalidateTournamentAthletes();

  return useMutation({
    mutationFn: (data: UpdateTournamentAthleteDTO) =>
      updateTournamentAthlete(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useRemoveTournamentAthlete(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeTournamentAthlete,
    onSuccess: () => {
      invalidateOnRemove(queryClient);
      toast.success('Athlete removed from tournament');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useBulkRemoveTournamentAthletes(options?: {
  onSuccess?: (removed: number) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkRemoveTournamentAthletesDTO) =>
      bulkRemoveTournamentAthletes(data),
    onSuccess: ({ removed }) => {
      invalidateOnRemove(queryClient);
      toast.success(
        removed === 1
          ? 'Athlete removed from tournament'
          : `${removed} athletes removed from tournament`
      );
      options?.onSuccess?.(removed);
    },
    onError: (err) => toast.error(err.message),
  });
}
