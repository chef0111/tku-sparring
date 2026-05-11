import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import type { ListTournamentsDTO } from '@/orpc/tournaments/tournaments.dto';
import { client } from '@/orpc/client';

const ALL_TOURNAMENTS_PER_PAGE = 1000;

export const tournamentsDefaultListInput = {
  page: 1,
  perPage: 20,
  status: [],
  sortDir: 'desc',
} satisfies ListTournamentsDTO;

const tournamentsAllListInput = {
  ...tournamentsDefaultListInput,
  perPage: ALL_TOURNAMENTS_PER_PAGE,
} satisfies ListTournamentsDTO;

export function tournamentsListQueryOptions(input: ListTournamentsDTO) {
  return queryOptions({
    queryKey: ['tournament', 'list', input] as const,
    queryFn: () => client.tournament.list(input),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function tournamentsAllQueryOptions() {
  return queryOptions({
    queryKey: ['tournament', 'list', 'all'] as const,
    queryFn: () => client.tournament.list(tournamentsAllListInput),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function tournamentQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['tournament', 'get', id] as const,
    queryFn: () => client.tournament.get({ id }),
  });
}

export function useTournaments() {
  return useQuery({
    ...tournamentsAllQueryOptions(),
    select: (data) => data.items,
  });
}

export function useTournamentList(input: ListTournamentsDTO) {
  return useQuery({
    ...tournamentsListQueryOptions(input),
    placeholderData: keepPreviousData,
  });
}

export function useTournament(id: string) {
  return useQuery(tournamentQueryOptions(id));
}

function useInvalidateTournaments() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['tournament'] });
  };
}

export function useCreateTournament() {
  const invalidate = useInvalidateTournaments();

  return useMutation({
    mutationFn: (data: { name: string }) => client.tournament.create(data),
    onSuccess: () => {
      invalidate();
      toast.success('Tournament created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create tournament');
    },
  });
}

export function useUpdateTournament(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateTournaments();

  return useMutation({
    mutationFn: (data: { id: string; name: string }) =>
      client.tournament.update(data),
    onSuccess: () => {
      invalidate();
      toast.success('Tournament updated');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useSetTournamentStatus(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateTournaments();

  return useMutation({
    mutationFn: (data: { id: string; status: 'active' | 'completed' }) =>
      client.tournament.setStatus(data),
    onSuccess: (tournament) => {
      invalidate();
      toast.success(
        tournament.status === 'active'
          ? 'Tournament activated'
          : 'Tournament completed'
      );
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

interface UseDeleteTournamentOptions {
  navigateAway?: boolean;
  onSuccess?: () => void;
}

export function useDeleteTournament(options?: UseDeleteTournamentOptions) {
  const navigate = useNavigate();
  const invalidate = useInvalidateTournaments();
  const navigateAway = options?.navigateAway ?? true;

  return useMutation({
    mutationFn: (data: { id: string }) => client.tournament.delete(data),
    onSuccess: () => {
      toast.success('Tournament deleted');
      invalidate();
      if (navigateAway) {
        navigate({ to: '/dashboard/tournaments' });
      }
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}
