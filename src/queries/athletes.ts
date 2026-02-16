import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client, orpc } from '@/orpc/client';

interface AthleteSearchParams {
  page: number;
  perPage: number;
  sort: Array<{ id: string; desc: boolean }>;
  filters: Array<{
    id: string;
    value: string | Array<string>;
    variant?: string;
    operator?: string;
  }>;
}

export function useAthletes(groupId: string | null) {
  return useQuery({
    ...orpc.athlete.list.queryOptions({ input: { groupId: groupId! } }),
    enabled: !!groupId,
  });
}

export function useAthletesByTournament(tournamentId: string) {
  return useQuery(orpc.athlete.list.queryOptions({ input: { tournamentId } }));
}

export function useAllAthletes(search: AthleteSearchParams) {
  return useQuery({
    ...orpc.athlete.list.queryOptions({
      input: {
        page: search.page,
        perPage: search.perPage,
        sort: search.sort,
        filters: search.filters.map((f) => ({
          id: f.id,
          value: f.value,
          variant: f.variant,
          operator: f.operator,
        })),
      },
    }),

    placeholderData: (prevData) => prevData,
  });
}

function useInvalidateAthletes() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['athlete'] });
    queryClient.invalidateQueries({ queryKey: ['group'] });
    queryClient.invalidateQueries({ queryKey: ['tournament'] });
  };
}

export function useCreateAthlete(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthletes();

  return useMutation({
    mutationFn: (data: {
      code: string;
      name: string;
      beltLevel: string;
      weight: number;
      affiliation: string;
      groupId: string;
      tournamentId: string;
    }) => client.athlete.create(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useCreateAthletes(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthletes();

  return useMutation({
    mutationFn: (data: {
      athletes: Array<{
        code: string;
        name: string;
        beltLevel: string;
        weight: number;
        affiliation: string;
        groupId: string;
        tournamentId: string;
      }>;
    }) => client.athlete.createMany(data),
    onSuccess: () => {
      invalidate();
      toast.success('Athletes created');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateAthlete(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthletes();

  return useMutation({
    mutationFn: (data: {
      id: string;
      code?: string;
      name?: string;
      beltLevel?: string;
      weight?: number;
      affiliation?: string;
    }) => client.athlete.update(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteAthlete(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthletes();

  return useMutation({
    mutationFn: (data: { id: string }) => client.athlete.delete(data),
    onSuccess: () => {
      invalidate();
      toast.success('Athlete deleted');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteAthletes(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthletes();

  return useMutation({
    mutationFn: (data: { ids: Array<string> }) =>
      client.athlete.deleteMany(data),
    onSuccess: () => {
      invalidate();
      toast.success('Athletes deleted');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useReorderAthletes(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthletes();

  return useMutation({
    mutationFn: (data: { ids: Array<string> }) => client.athlete.reorder(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}
