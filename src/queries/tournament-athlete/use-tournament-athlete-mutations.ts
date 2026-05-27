import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  BulkAddAthletesDTO,
  UpdateTournamentAthleteDTO,
} from '@/orpc/tournament-athletes/dto';
import { invalidateTournamentAthleteQueries } from '@/queries/tournament-athlete/invalidate-tournament-athlete-cache';
import {
  bulkAddTournamentAthletes,
  removeTournamentAthlete,
  updateTournamentAthlete,
} from '@/queries/lib/tournament-athlete/tournament-athlete-api';

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
  const invalidate = useInvalidateTournamentAthletes();

  return useMutation({
    mutationFn: (data: BulkAddAthletesDTO) => bulkAddTournamentAthletes(data),
    onSuccess: (result) => {
      invalidate();
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
  const invalidate = useInvalidateTournamentAthletes();

  return useMutation({
    mutationFn: removeTournamentAthlete,
    onSuccess: () => {
      invalidate();
      toast.success('Athlete removed from tournament');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}
