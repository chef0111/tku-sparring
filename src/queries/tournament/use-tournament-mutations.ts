import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import type {
  EnsureArenaSlotDTO,
  RetireArenaDTO,
} from '@/orpc/tournaments/dto';
import type { TournamentStatus } from '@/contracts/tournament/list';
import {
  mergeArenaDivisionOrderAfterCrossArenaMove,
  mergeArenaDivisionOrderAfterRetireArena,
  patchArenaDivisionOrderJson,
} from '@/lib/tournament/arena/arena-division-order';
import { divisionListQueryOptions } from '@/queries/division/division-list-query-options';
import {
  invalidateAfterArenaLayoutChange,
  invalidateAfterTournamentStatusChange,
  invalidateTournamentDetail,
  invalidateTournamentQueries,
} from '@/queries/tournament/invalidate-tournament-cache';
import { tournamentQueryOptions } from '@/queries/tournament/tournament-query-options';
import {
  createTournament,
  deleteTournament,
  ensureArenaSlot,
  moveDivisionArena,
  retireArena,
  setArenaDivisionOrder,
  setTournamentStatus,
  updateTournament,
} from '@/queries/api/tournament-api';

function useInvalidateTournaments() {
  const queryClient = useQueryClient();
  return () => invalidateTournamentQueries(queryClient);
}

export function useCreateTournament() {
  const invalidate = useInvalidateTournaments();

  return useMutation({
    mutationFn: createTournament,
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
    mutationFn: updateTournament,
    onSuccess: () => {
      invalidate();
      toast.success('Tournament updated');
      options?.onSuccess?.();
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useSetArenaDivisionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setArenaDivisionOrder,
    onMutate: async (variables) => {
      const key = tournamentQueryOptions(variables.tournamentId).queryKey;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          arenaDivisionOrder: patchArenaDivisionOrderJson(
            old.arenaDivisionOrder,
            variables.arenaIndex,
            variables.divisionIds
          ),
        };
      });
      return { previous };
    },
    onError: (err, variables, context) => {
      const key = tournamentQueryOptions(variables.tournamentId).queryKey;
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error(
        err instanceof Error ? err.message : 'Could not save arena order'
      );
    },
    onSettled: (_data, _err, variables) => {
      invalidateAfterArenaLayoutChange(queryClient, variables.tournamentId);
    },
  });
}

export function useMoveDivisionBetweenArenas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moveDivisionArena,
    onMutate: async (variables) => {
      const tKey = tournamentQueryOptions(variables.tournamentId).queryKey;
      const dKey = divisionListQueryOptions(variables.tournamentId).queryKey;

      await queryClient.cancelQueries({ queryKey: tKey });
      await queryClient.cancelQueries({ queryKey: dKey });

      const previousTournament = queryClient.getQueryData(tKey);
      const previousDivisions = queryClient.getQueryData(dKey);

      if (
        !previousTournament ||
        typeof previousTournament !== 'object' ||
        !Array.isArray(previousDivisions)
      ) {
        return { tKey, dKey, previousTournament, previousDivisions };
      }

      const divisions = previousDivisions as Array<{
        id: string;
        arenaIndex: number;
      }>;
      const tournament = previousTournament as
        | Record<string, unknown>
        | undefined;
      const arenaDivisionOrder = tournament?.arenaDivisionOrder;

      const nextJson = mergeArenaDivisionOrderAfterCrossArenaMove({
        arenaDivisionOrder,
        divisions,
        divisionId: variables.divisionId,
        fromArena: variables.fromArena,
        toArena: variables.toArena,
        insertIndex: variables.insertIndex,
      });

      queryClient.setQueryData(tKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          arenaDivisionOrder: nextJson,
        };
      });

      queryClient.setQueryData(dKey, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((d) =>
          d.id === variables.divisionId
            ? { ...d, arenaIndex: variables.toArena }
            : d
        );
      });

      return {
        previousTournament,
        previousDivisions,
        tKey,
        dKey,
      };
    },
    onError: (err, _variables, context) => {
      if (context?.previousTournament !== undefined) {
        queryClient.setQueryData(context.tKey, context.previousTournament);
      }
      if (context?.previousDivisions !== undefined) {
        queryClient.setQueryData(context.dKey, context.previousDivisions);
      }
      toast.error(
        err instanceof Error
          ? err.message
          : 'Could not move division between arenas'
      );
    },
    onSettled: (_data, _err, variables) => {
      invalidateAfterArenaLayoutChange(queryClient, variables.tournamentId);
    },
  });
}

export function useEnsureArenaSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EnsureArenaSlotDTO) => ensureArenaSlot(input),
    onMutate: async (variables) => {
      const tKey = tournamentQueryOptions(variables.tournamentId).queryKey;
      await queryClient.cancelQueries({ queryKey: tKey });
      const previous = queryClient.getQueryData(tKey);
      queryClient.setQueryData(tKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          arenaDivisionOrder: patchArenaDivisionOrderJson(
            old.arenaDivisionOrder,
            variables.arenaIndex,
            []
          ),
        };
      });
      return { previous, tKey };
    },
    onError: (err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.tKey, context.previous);
      }
      toast.error(
        err instanceof Error ? err.message : 'Could not add arena slot'
      );
    },
    onSettled: (_data, _err, variables) => {
      invalidateTournamentDetail(queryClient, variables.tournamentId);
    },
  });
}

export function useRetireArena() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RetireArenaDTO) => retireArena(input),
    onMutate: async (variables) => {
      const tKey = tournamentQueryOptions(variables.tournamentId).queryKey;
      const dKey = divisionListQueryOptions(variables.tournamentId).queryKey;

      await queryClient.cancelQueries({ queryKey: tKey });
      await queryClient.cancelQueries({ queryKey: dKey });

      const previousTournament = queryClient.getQueryData(tKey);
      const previousDivisions = queryClient.getQueryData(dKey);

      if (
        !previousTournament ||
        typeof previousTournament !== 'object' ||
        !Array.isArray(previousDivisions)
      ) {
        return { tKey, dKey, previousTournament, previousDivisions };
      }

      const divisions = previousDivisions as Array<{
        id: string;
        arenaIndex: number;
      }>;
      const tournament = previousTournament as
        | Record<string, unknown>
        | undefined;
      const arenaDivisionOrder = tournament?.arenaDivisionOrder;

      const nextJson = mergeArenaDivisionOrderAfterRetireArena({
        arenaDivisionOrder,
        divisions,
        fromArena: variables.fromArena,
        toArena: variables.toArena,
      });

      queryClient.setQueryData(tKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          arenaDivisionOrder: nextJson,
        };
      });

      queryClient.setQueryData<Array<{ id: string; arenaIndex: number }>>(
        dKey,
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((d) =>
            d.arenaIndex === variables.fromArena
              ? { ...d, arenaIndex: variables.toArena }
              : d
          );
        }
      );

      return {
        previousTournament,
        previousDivisions,
        tKey,
        dKey,
      };
    },
    onError: (err, _variables, context) => {
      if (context?.previousTournament !== undefined) {
        queryClient.setQueryData(context.tKey, context.previousTournament);
      }
      if (context?.previousDivisions !== undefined) {
        queryClient.setQueryData(context.dKey, context.previousDivisions);
      }
      toast.error(
        err instanceof Error ? err.message : 'Could not remove arena'
      );
    },
    onSettled: (_data, _err, variables) => {
      invalidateAfterArenaLayoutChange(queryClient, variables.tournamentId);
    },
  });
}

export function useSetTournamentStatus(options?: {
  onSuccess?: () => void;
  suppressToast?: boolean;
}) {
  const invalidate = useInvalidateTournaments();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      status: TournamentStatus;
      force?: boolean;
    }) => setTournamentStatus(data),
    onSuccess: (tournament, variables) => {
      invalidate();
      invalidateAfterTournamentStatusChange(queryClient, tournament.id);
      if (!options?.suppressToast) {
        if (variables.force) {
          toast.success(`Tournament status set to ${tournament.status}`);
        } else {
          toast.success(
            tournament.status === 'active'
              ? 'Tournament activated'
              : 'Tournament completed'
          );
        }
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

interface UseDeleteTournamentOptions {
  navigateAway?: boolean;
  onSuccess?: () => void;
}

export function useDeleteTournament(options?: UseDeleteTournamentOptions) {
  const navigate = useNavigate();
  const invalidate = useInvalidateTournaments();
  const navigateAway = options?.navigateAway ?? true;

  return useMutation({
    mutationFn: deleteTournament,
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
