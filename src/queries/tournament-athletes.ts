import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  BulkAddAthletesDTO,
  ListTournamentAthletesDTO,
  UpdateTournamentAthleteDTO,
} from '@/orpc/tournament-athletes/dto';
import { client } from '@/orpc/client';
import { listAthletePlaceholderKey } from '@/lib/queries/tournament-athletes';

export function useTournamentAthletes(input: ListTournamentAthletesDTO) {
  const placeholderKey = listAthletePlaceholderKey(input);
  return useQuery({
    queryKey: ['tournamentAthlete', 'list', input] as const,
    queryFn: () => client.tournamentAthlete.list(input),
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery) return undefined;
      const prevInput = previousQuery.queryKey[2] as ListTournamentAthletesDTO;
      if (listAthletePlaceholderKey(prevInput) !== placeholderKey) {
        return undefined;
      }
      return previousData;
    },
  });
}

export function useTournamentAthletesInfinite(
  input: Omit<ListTournamentAthletesDTO, 'page'>
) {
  return useInfiniteQuery({
    queryKey: ['tournamentAthlete', 'list', 'infinite', input] as const,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      client.tournamentAthlete.list({ ...input, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last, allPages) => {
      const fetched = allPages.reduce((acc, p) => acc + p.items.length, 0);
      return fetched < last.total ? allPages.length + 1 : undefined;
    },
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
