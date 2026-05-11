import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { leasesQueryOptions, setLeaseSnapshotInCache } from './leases';
import type { LeaseSnapshot } from './leases';

function createSnapshot(id: string): LeaseSnapshot {
  return [
    {
      id: `lease-${id}`,
      groupId: `group-${id}`,
      tournamentId: 'tournament-1',
      acquiredAt: new Date('2026-05-01T10:00:00.000Z'),
      lastHeartbeatAt: new Date('2026-05-01T10:00:00.000Z'),
      expiresAt: new Date('2026-05-01T10:01:00.000Z'),
      leaseStatus: 'held_by_other',
      takeoverRequests: [],
    },
  ];
}

describe('setLeaseSnapshotInCache', () => {
  it('updates the generic tournament lease snapshot cache', () => {
    const queryClient = new QueryClient();
    const previousSnapshot = createSnapshot('old');
    const nextSnapshot = createSnapshot('new');

    queryClient.setQueryData(
      leasesQueryOptions('tournament-1').queryKey,
      previousSnapshot
    );

    setLeaseSnapshotInCache(queryClient, 'tournament-1', nextSnapshot);

    expect(
      queryClient.getQueryData(leasesQueryOptions('tournament-1').queryKey)
    ).toEqual(nextSnapshot);
  });

  it('does not overwrite device-specific lease caches with a generic stream snapshot', () => {
    const queryClient = new QueryClient();
    const genericSnapshot = createSnapshot('generic');
    const deviceSnapshot = [
      {
        ...createSnapshot('device')[0],
        leaseStatus: 'held_by_me' as const,
      },
    ];

    queryClient.setQueryData(
      leasesQueryOptions('tournament-1').queryKey,
      createSnapshot('old')
    );
    queryClient.setQueryData(
      leasesQueryOptions('tournament-1', 'device-1').queryKey,
      deviceSnapshot
    );

    setLeaseSnapshotInCache(queryClient, 'tournament-1', genericSnapshot);

    expect(
      queryClient.getQueryData(leasesQueryOptions('tournament-1').queryKey)
    ).toEqual(genericSnapshot);
    expect(
      queryClient.getQueryData(
        leasesQueryOptions('tournament-1', 'device-1').queryKey
      )
    ).toEqual(deviceSnapshot);
  });
});
