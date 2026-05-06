import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  AthleteProfilesDTO,
  CheckDuplicateDTO,
  CreateAthleteProfileDTO,
  UpdateAthleteProfileDTO,
} from '@/orpc/athlete-profiles/athlete-profiles.dto';
import { client } from '@/orpc/client';

export const athleteProfilesDefaultListInput = {
  page: 1,
  perPage: 10,
  sortDir: 'asc',
} satisfies AthleteProfilesDTO;

export function athleteProfilesQueryOptions(input: AthleteProfilesDTO) {
  return queryOptions({
    queryKey: ['athleteProfile', 'list', input] as const,
    queryFn: () => client.athleteProfile.list(input),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAthleteProfiles(input: AthleteProfilesDTO) {
  return useQuery({
    ...athleteProfilesQueryOptions(input),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateAthleteProfiles() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['athleteProfile'] });
  };
}

export function useCreateAthleteProfile(options?: {
  onSuccess?: () => void;
  onHardBlock?: () => void;
  onPossibleDuplicate?: (duplicateIds: Array<string>) => void;
}) {
  const invalidate = useInvalidateAthleteProfiles();

  return useMutation({
    mutationFn: (data: CreateAthleteProfileDTO) =>
      client.athleteProfile.create(data),
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
        return;
      }
    },
  });
}

export function useCheckDuplicate() {
  return useMutation({
    mutationFn: (data: CheckDuplicateDTO) =>
      client.athleteProfile.checkDuplicate(data),
  });
}

export function useUpdateAthleteProfile(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthleteProfiles();

  return useMutation({
    mutationFn: (data: UpdateAthleteProfileDTO) =>
      client.athleteProfile.update(data),
    onSuccess: () => {
      invalidate();
      toast.success('Athlete updated');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteAthleteProfile(options?: { onSuccess?: () => void }) {
  const invalidate = useInvalidateAthleteProfiles();

  return useMutation({
    mutationFn: (data: { id: string }) => client.athleteProfile.delete(data),
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
    mutationFn: (data: { ids: Array<string> }) =>
      client.athleteProfile.bulkDelete(data),
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
