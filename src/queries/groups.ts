import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  AssignAthleteDTO,
  AutoAssignDTO,
  UnassignAthleteDTO,
  UpdateGroupDTO,
} from '@/orpc/groups/groups.dto';
import { client, orpc } from '@/orpc/client';

export function useGroups(tournamentId: string) {
  return useQuery(orpc.group.list.queryOptions({ input: { tournamentId } }));
}

function useInvalidateGroups() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['tournament'] });
    queryClient.invalidateQueries({ queryKey: ['group'] });
    queryClient.invalidateQueries({ queryKey: ['tournamentAthlete'] });
  };
}

export function useCreateGroup(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: (data: { name: string; tournamentId: string }) =>
      client.group.create(data),
    onSuccess: () => {
      invalidate();
      toast.success('Group created');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateGroup(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: (data: UpdateGroupDTO) => client.group.update(data),
    onSuccess: () => {
      invalidate();
      toast.success('Group updated');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteGroup(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: (data: { id: string }) => client.group.delete(data),
    onSuccess: () => {
      invalidate();
      toast.success('Group deleted');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useAutoAssignGroup(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: (data: AutoAssignDTO) => client.group.autoAssign(data),
    onSuccess: (result) => {
      invalidate();
      toast.success(`Auto-assigned ${result.assigned} athletes`);
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useAssignAthlete(options?: {
  onSuccess?: () => void;
  suppressErrorToast?: boolean;
}) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: (data: AssignAthleteDTO) => client.group.assignAthlete(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (err) => {
      if (!options?.suppressErrorToast) toast.error(err.message);
    },
  });
}

export function useUnassignAthlete(options?: {
  onSuccess?: () => void;
  suppressErrorToast?: boolean;
}) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: (data: UnassignAthleteDTO) =>
      client.group.unassignAthlete(data),
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (err) => {
      if (!options?.suppressErrorToast) toast.error(err.message);
    },
  });
}
