import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  BulkAddAthletesDTO,
  ListTournamentAthletesDTO,
  UpdateTournamentAthleteDTO,
} from '@/orpc/tournament-athletes/tournament-athletes.dto';
import { client } from '@/orpc/client';

export function useTournamentAthletes(input: ListTournamentAthletesDTO) {
  return useQuery({
    queryKey: ['tournamentAthlete', 'list', input] as const,
    queryFn: () => client.tournamentAthlete.list(input),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateTournamentAthletes() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['tournamentAthlete'] });
    queryClient.invalidateQueries({ queryKey: ['tournament'] });
  };
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
    mutationFn: (data: BulkAddAthletesDTO) =>
      client.tournamentAthlete.bulkAdd(data),
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
      client.tournamentAthlete.update(data),
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
    mutationFn: (data: { id: string }) => client.tournamentAthlete.remove(data),
    onSuccess: () => {
      invalidate();
      toast.success('Athlete removed from tournament');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}
