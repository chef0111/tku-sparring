import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invalidateAfterGroupWrite } from '@/queries/group/invalidate-group-cache';
import {
  assignAthlete,
  autoAssignAllGroups,
  autoAssignGroup,
  createGroup,
  deleteGroup,
  unassignAthlete,
  updateGroup,
} from '@/queries/api/group-api';

function useInvalidateGroups() {
  const queryClient = useQueryClient();
  return (tournamentId?: string) =>
    invalidateAfterGroupWrite(queryClient, tournamentId);
}

export function useCreateGroup(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: (_data, variables) => {
      invalidate(variables.tournamentId);
      toast.success('Group created');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateGroup(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: updateGroup,
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
    mutationFn: deleteGroup,
    onSuccess: () => {
      invalidate();
      toast.success('Group deleted');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useAutoAssignGroup(options?: {
  onSuccess?: () => void;
  suppressToast?: boolean;
}) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: autoAssignGroup,
    onSuccess: (result) => {
      invalidate();
      if (!options?.suppressToast) {
        toast.success(`Auto-assigned ${result.assigned} athletes`);
      }
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useAutoAssignAll(options?: {
  onSuccess?: (result: {
    assigned: number;
    groupsRun: number;
    groupsSkipped: number;
  }) => void;
}) {
  const invalidate = useInvalidateGroups();

  return useMutation({
    mutationFn: autoAssignAllGroups,
    onSuccess: (result) => {
      invalidate();
      options?.onSuccess?.(result);
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
    mutationFn: assignAthlete,
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
    mutationFn: unassignAthlete,
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (err) => {
      if (!options?.suppressErrorToast) toast.error(err.message);
    },
  });
}
