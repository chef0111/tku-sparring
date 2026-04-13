import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { client, orpc } from '@/orpc/client';

export function useTournaments() {
  return useQuery(orpc.tournament.list.queryOptions({ input: {} }));
}

export function useTournament(id: string) {
  return useQuery(orpc.tournament.get.queryOptions({ input: { id } }));
}

export function useCreateTournament() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { name: string }) => client.tournament.create(data),
    onSuccess: (tournament) => {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      toast.success('Tournament created successfully');
      navigate({
        to: '/dashboard/tournaments/$id/builder',
        params: { id: tournament.id },
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create tournament');
    },
  });
}

export function useUpdateTournament(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; name: string }) =>
      client.tournament.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      toast.success('Tournament updated');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteTournament() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: { id: string }) => client.tournament.delete(data),
    onSuccess: () => {
      toast.success('Tournament deleted');
      navigate({ to: '/dashboard/tournaments' });
    },
    onError: (err) => toast.error(err.message),
  });
}
