import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import type {
  EnsureArenaSlotDTO,
  ListTournamentsDTO,
  MoveGroupArenaDTO,
  RetireArenaDTO,
} from '@/orpc/tournaments/dto';
import { client, orpc } from '@/orpc/client';
import {
  mergeArenaGroupOrderAfterCrossArenaMove,
  mergeArenaGroupOrderAfterRetireArena,
  patchArenaGroupOrderJson,
} from '@/lib/tournament/arena-group-order';
import { invalidateOrpcGroupListQueries } from '@/queries/groups';

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

export function useSetArenaGroupOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tournamentId: string;
      arenaIndex: number;
      groupIds: Array<string>;
    }) => client.tournament.setArenaGroupOrder(input),
    onMutate: async (variables) => {
      const key = tournamentQueryOptions(variables.tournamentId).queryKey;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) => {
        if (!old || typeof old !== 'object') return old;
        const o = old as Record<string, unknown>;
        return {
          ...o,
          arenaGroupOrder: patchArenaGroupOrderJson(
            o.arenaGroupOrder,
            variables.arenaIndex,
            variables.groupIds
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
      void queryClient.invalidateQueries({
        queryKey: ['tournament', 'get', variables.tournamentId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['match', 'list', 'tournament', variables.tournamentId],
      });
    },
  });
}

export function useMoveGroupBetweenArenas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MoveGroupArenaDTO) =>
      client.tournament.moveGroupArena(input),
    onMutate: async (variables) => {
      const tKey = tournamentQueryOptions(variables.tournamentId).queryKey;
      const gKey = orpc.group.list.queryOptions({
        input: { tournamentId: variables.tournamentId },
      }).queryKey;

      await queryClient.cancelQueries({ queryKey: tKey });
      await queryClient.cancelQueries({ queryKey: gKey });

      const previousTournament = queryClient.getQueryData(tKey);
      const previousGroups = queryClient.getQueryData(gKey);

      if (
        !previousTournament ||
        typeof previousTournament !== 'object' ||
        !Array.isArray(previousGroups)
      ) {
        return { tKey, gKey, previousTournament, previousGroups };
      }

      const groups = previousGroups as Array<{
        id: string;
        arenaIndex: number;
      }>;
      const tournament = previousTournament as
        | Record<string, unknown>
        | undefined;
      const arenaGroupOrder = tournament?.arenaGroupOrder;

      const nextJson = mergeArenaGroupOrderAfterCrossArenaMove({
        arenaGroupOrder,
        groups,
        groupId: variables.groupId,
        fromArena: variables.fromArena,
        toArena: variables.toArena,
        insertIndex: variables.insertIndex,
      });

      queryClient.setQueryData(tKey, (old) => {
        if (!old || typeof old !== 'object') return old;
        const o = old as Record<string, unknown>;
        return {
          ...o,
          arenaGroupOrder: nextJson,
        };
      });

      queryClient.setQueryData(gKey, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((g: { id: string; arenaIndex: number }) =>
          g.id === variables.groupId
            ? { ...g, arenaIndex: variables.toArena }
            : g
        );
      });

      return {
        previousTournament,
        previousGroups,
        tKey,
        gKey,
      };
    },
    onError: (err, _variables, context) => {
      if (context?.previousTournament !== undefined) {
        queryClient.setQueryData(context.tKey, context.previousTournament);
      }
      if (context?.previousGroups !== undefined) {
        queryClient.setQueryData(context.gKey, context.previousGroups);
      }
      toast.error(
        err instanceof Error
          ? err.message
          : 'Could not move group between arenas'
      );
    },
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['tournament', 'get', variables.tournamentId],
      });
      void invalidateOrpcGroupListQueries(queryClient);
      void queryClient.invalidateQueries({
        queryKey: ['match', 'list', 'tournament', variables.tournamentId],
      });
    },
  });
}

export function useEnsureArenaSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: EnsureArenaSlotDTO) =>
      client.tournament.ensureArenaSlot(input),
    onMutate: async (variables) => {
      const tKey = tournamentQueryOptions(variables.tournamentId).queryKey;
      await queryClient.cancelQueries({ queryKey: tKey });
      const previous = queryClient.getQueryData(tKey);
      queryClient.setQueryData(tKey, (old) => {
        if (!old || typeof old !== 'object') return old;
        const o = old as Record<string, unknown>;
        return {
          ...o,
          arenaGroupOrder: patchArenaGroupOrderJson(
            o.arenaGroupOrder,
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
      void queryClient.invalidateQueries({
        queryKey: ['tournament', 'get', variables.tournamentId],
      });
    },
  });
}

export function useRetireArena() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RetireArenaDTO) => client.tournament.retireArena(input),
    onMutate: async (variables) => {
      const tKey = tournamentQueryOptions(variables.tournamentId).queryKey;
      const gKey = orpc.group.list.queryOptions({
        input: { tournamentId: variables.tournamentId },
      }).queryKey;

      await queryClient.cancelQueries({ queryKey: tKey });
      await queryClient.cancelQueries({ queryKey: gKey });

      const previousTournament = queryClient.getQueryData(tKey);
      const previousGroups = queryClient.getQueryData(gKey);

      if (
        !previousTournament ||
        typeof previousTournament !== 'object' ||
        !Array.isArray(previousGroups)
      ) {
        return { tKey, gKey, previousTournament, previousGroups };
      }

      const groups = previousGroups as Array<{
        id: string;
        arenaIndex: number;
      }>;
      const tournament = previousTournament as
        | Record<string, unknown>
        | undefined;
      const arenaGroupOrder = tournament?.arenaGroupOrder;

      const nextJson = mergeArenaGroupOrderAfterRetireArena({
        arenaGroupOrder,
        groups,
        fromArena: variables.fromArena,
        toArena: variables.toArena,
      });

      queryClient.setQueryData(tKey, (old) => {
        if (!old || typeof old !== 'object') return old;
        const o = old as Record<string, unknown>;
        return {
          ...o,
          arenaGroupOrder: nextJson,
        };
      });

      queryClient.setQueryData(gKey, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((g: { id: string; arenaIndex: number }) =>
          g.arenaIndex === variables.fromArena
            ? { ...g, arenaIndex: variables.toArena }
            : g
        );
      });

      return {
        previousTournament,
        previousGroups,
        tKey,
        gKey,
      };
    },
    onError: (err, _variables, context) => {
      if (context?.previousTournament !== undefined) {
        queryClient.setQueryData(context.tKey, context.previousTournament);
      }
      if (context?.previousGroups !== undefined) {
        queryClient.setQueryData(context.gKey, context.previousGroups);
      }
      toast.error(
        err instanceof Error ? err.message : 'Could not remove arena'
      );
    },
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['tournament', 'get', variables.tournamentId],
      });
      void invalidateOrpcGroupListQueries(queryClient);
      void queryClient.invalidateQueries({
        queryKey: ['match', 'list', 'tournament', variables.tournamentId],
      });
    },
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
