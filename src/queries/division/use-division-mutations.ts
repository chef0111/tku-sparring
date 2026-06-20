import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invalidateAfterDivisionWrite } from '@/queries/division/invalidate-division-cache';
import {
  assignAthlete,
  autoAssignAllDivisions,
  autoAssignDivision,
  createDivision,
  deleteDivision,
  unassignAthlete,
  updateDivision,
} from '@/queries/api/division-api';

function useInvalidateDivisions() {
  const queryClient = useQueryClient();
  return (tournamentId?: string) =>
    invalidateAfterDivisionWrite(queryClient, tournamentId);
}

export function useCreateDivision(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateDivisions();

  return useMutation({
    mutationFn: createDivision,
    onSuccess: (_data, variables) => {
      invalidate(variables.tournamentId);
      toast.success('Division created');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateDivision(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateDivisions();

  return useMutation({
    mutationFn: updateDivision,
    onSuccess: () => {
      invalidate();
      toast.success('Division updated');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteDivision(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateDivisions();

  return useMutation({
    mutationFn: deleteDivision,
    onSuccess: () => {
      invalidate();
      toast.success('Division deleted');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useAutoAssignDivision(options?: {
  onSuccess?: () => void;
  suppressToast?: boolean;
}) {
  const invalidate = useInvalidateDivisions();

  return useMutation({
    mutationFn: autoAssignDivision,
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
    divisionsRun: number;
    divisionsSkipped: number;
  }) => void;
}) {
  const invalidate = useInvalidateDivisions();

  return useMutation({
    mutationFn: autoAssignAllDivisions,
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
  const invalidate = useInvalidateDivisions();

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
  const invalidate = useInvalidateDivisions();

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
