import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CheckDuplicateDTO } from '@/orpc/athlete-profiles/dto';
import { invalidateAthleteProfileQueries } from '@/queries/athlete-profile/invalidate-athlete-profile-cache';
import {
  bulkDeleteAthleteProfiles,
  checkAthleteProfileDuplicate,
  createAthleteProfile,
  deleteAthleteProfile,
  updateAthleteProfile,
} from '@/queries/api/athlete-profile-api';

function useInvalidateAthleteProfiles() {
  const queryClient = useQueryClient();
  return () => invalidateAthleteProfileQueries(queryClient);
}

export function useCreateAthleteProfile(options?: {
  onSuccess?: () => void;
  onHardBlock?: () => void;
  onPossibleDuplicate?: (duplicateIds: Array<string>) => void;
}) {
  const invalidate = useInvalidateAthleteProfiles();

  return useMutation({
    mutationFn: createAthleteProfile,
    onSuccess: () => {
      invalidate();
      options?.onSuccess?.();
    },
    onError: (err) => {
      const message = err.message ?? '';
      if (message.startsWith('DUPLICATE_ATHLETE_CODE_NAME:')) {
        options?.onHardBlock?.();
        return;
      }
      if (message.startsWith('POSSIBLE_DUPLICATE:')) {
        try {
          const ids = JSON.parse(
            message.replace('POSSIBLE_DUPLICATE: ', '')
          ) as Array<string>;
          options?.onPossibleDuplicate?.(ids);
        } catch {
          options?.onPossibleDuplicate?.([]);
        }
      }
    },
  });
}

export function useCheckDuplicate() {
  return useMutation({
    mutationFn: (data: CheckDuplicateDTO) => checkAthleteProfileDuplicate(data),
  });
}

export function useUpdateAthleteProfile(options?: {
  onSuccess?: () => void;
  suppressToast?: boolean;
}) {
  const invalidate = useInvalidateAthleteProfiles();

  return useMutation({
    mutationFn: updateAthleteProfile,
    onSuccess: () => {
      invalidate();
      if (!options?.suppressToast) {
        toast.success('Athlete updated');
      }
      options?.onSuccess?.();
    },
    onError: (err) => {
      if (!options?.suppressToast) {
        toast.error(err.message);
      }
    },
  });
}

export function useDeleteAthleteProfile(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthleteProfiles();

  return useMutation({
    mutationFn: deleteAthleteProfile,
    onSuccess: () => {
      invalidate();
      toast.success('Athlete deleted');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useBulkDeleteAthleteProfiles(options?: {
  onSuccess?: () => void;
}) {
  const invalidate = useInvalidateAthleteProfiles();

  return useMutation({
    mutationFn: bulkDeleteAthleteProfiles,
    onSuccess: (deletedCount) => {
      invalidate();
      toast.success(
        deletedCount === 1
          ? 'Athlete deleted'
          : `${deletedCount} athletes deleted`
      );
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}
