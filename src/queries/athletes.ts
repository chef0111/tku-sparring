import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client, orpc } from '@/orpc/client';

export function useAthletes(groupId: string | null) {
  return useQuery({
    ...orpc.athlete.list.queryOptions({ input: { groupId: groupId! } }),
    enabled: !!groupId,
  });
}

export function useAthletesByTournament(tournamentId: string) {
  return useQuery(orpc.athlete.list.queryOptions({ input: { tournamentId } }));
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

export function useUpdateAthlete(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthletes();

  return useMutation({
    mutationFn: (data: {
      id: string;
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
