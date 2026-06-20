import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { AthleteProfileData } from '@/features/dashboard/types';
import { bulkAddAthleteResult } from '@/features/dashboard/lib/athlete/bulk-add-athletes';
import { useBulkAddAthletes } from '@/queries/tournament-athlete';
import {
  useAthleteProfilesInfinite,
  useAthleteProfilesOrgTotal,
} from '@/queries/athlete-profile';

const ROW_HEIGHT = 76;
const PAGE_SIZE = 30;

export interface UseAddAthletesSheetArgs {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  readOnly: boolean;
}

export function useAddAthletesSheet({
  open,
  onOpenChange,
  tournamentId,
  readOnly,
}: UseAddAthletesSheetArgs) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [autoAssign, setAutoAssign] = React.useState(false);
  const [query, setQuery] = React.useState<string | null>(null);
  const [gender, setGender] = React.useState<'M' | 'F' | null>(null);
  const [beltMin, setBeltMin] = React.useState<number | null>(null);
  const [beltMax, setBeltMax] = React.useState<number | null>(null);
  const [weightMin, setWeightMin] = React.useState<number | null>(null);
  const [weightMax, setWeightMax] = React.useState<number | null>(null);

  const orgQuery = useAthleteProfilesOrgTotal({ enabled: open });
  const orgTotal = orgQuery.data ?? 0;

  const listQuery = useAthleteProfilesInfinite({
    excludeTournamentId: tournamentId,
    perPage: PAGE_SIZE,
    query: query ?? undefined,
    gender: gender ? [gender] : undefined,
    beltLevelMin: beltMin ?? undefined,
    beltLevelMax: beltMax ?? undefined,
    weightMin: weightMin ?? undefined,
    weightMax: weightMax ?? undefined,
    filters: [],
    joinOperator: 'and',
    sorting: [],
  });

  const items = React.useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data]
  );
  const total = listQuery.data?.pages[0]?.total ?? 0;
  const hasFilters =
    !!query ||
    !!gender ||
    beltMin != null ||
    beltMax != null ||
    weightMin != null ||
    weightMax != null;

  const bulkAdd = useBulkAddAthletes({
    onSuccess: (result) => {
      bulkAddAthleteResult(result);
      setSelectedIds(new Set());
      setAutoAssign(false);
      onOpenChange(false);
    },
  });

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: total,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    enabled: open,
  });

  React.useLayoutEffect(() => {
    if (!open) return;
    rowVirtualizer.measure();
    const frame = requestAnimationFrame(() => rowVirtualizer.measure());
    return () => cancelAnimationFrame(frame);
  }, [open, rowVirtualizer]);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const lastVirtualItem = virtualItems[virtualItems.length - 1];

  React.useEffect(() => {
    if (!lastVirtualItem) return;
    if (
      lastVirtualItem.index >= items.length - 1 &&
      listQuery.hasNextPage &&
      !listQuery.isFetchingNextPage
    ) {
      void listQuery.fetchNextPage();
    }
  }, [
    lastVirtualItem?.index,
    items.length,
    listQuery.hasNextPage,
    listQuery.isFetchingNextPage,
    listQuery.fetchNextPage,
  ]);

  React.useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setAutoAssign(false);
    }
  }, [open]);

  const loadedIds = React.useMemo(() => items.map((item) => item.id), [items]);
  const allShownSelected =
    loadedIds.length > 0 && loadedIds.every((id) => selectedIds.has(id));

  const toggleProfile = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllShown = React.useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allShownSelected) {
        for (const id of loadedIds) next.delete(id);
      } else {
        for (const id of loadedIds) next.add(id);
      }
      return next;
    });
  }, [allShownSelected, loadedIds]);

  const handleSubmit = React.useCallback(() => {
    if (selectedIds.size === 0 || readOnly) return;
    bulkAdd.mutate({
      tournamentId,
      athleteProfileIds: [...selectedIds],
      autoAssign,
    });
  }, [autoAssign, bulkAdd, readOnly, selectedIds, tournamentId]);

  const emptyLibrary =
    !listQuery.isPending && total === 0 && !hasFilters && orgTotal === 0;
  const allInTournament =
    !listQuery.isPending && total === 0 && !hasFilters && orgTotal > 0;

  const patchBeltFilter = React.useCallback(
    (patch: { poolBeltMin?: number | null; poolBeltMax?: number | null }) => {
      if ('poolBeltMin' in patch) setBeltMin(patch.poolBeltMin ?? null);
      if ('poolBeltMax' in patch) setBeltMax(patch.poolBeltMax ?? null);
    },
    []
  );

  const patchWeightFilter = React.useCallback(
    (patch: {
      poolWeightMin?: number | null;
      poolWeightMax?: number | null;
    }) => {
      if ('poolWeightMin' in patch) setWeightMin(patch.poolWeightMin ?? null);
      if ('poolWeightMax' in patch) setWeightMax(patch.poolWeightMax ?? null);
    },
    []
  );

  return {
    filters: {
      query,
      setQuery,
      gender,
      setGender,
      beltMin,
      beltMax,
      weightMin,
      weightMax,
      patchBeltFilter,
      patchWeightFilter,
    },
    list: {
      isPending: listQuery.isPending,
      items: items as Array<AthleteProfileData>,
      total,
      hasFilters,
      emptyLibrary,
      allInTournament,
    },
    selection: {
      selectedIds,
      selectedCount: selectedIds.size,
      autoAssign,
      setAutoAssign,
      allShownSelected,
      toggleProfile,
      toggleSelectAllShown,
    },
    virtual: {
      scrollRef,
      rowVirtualizer,
      virtualItems,
    },
    submit: {
      handleSubmit,
      isPending: bulkAdd.isPending,
      canSubmit: !readOnly && selectedIds.size > 0 && !bulkAdd.isPending,
    },
  };
}

export type AddAthletesSheetState = ReturnType<typeof useAddAthletesSheet>;
