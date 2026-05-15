import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useArenaMutation } from '@/features/app/hooks/use-arena-mutation';
import { client } from '@/orpc/client';
import { useLeaseStream } from '@/hooks/use-lease-stream';
import { useLeases } from '@/queries/leases';

const HEARTBEAT_MS = 20_000;

function invalidateLeaseList(
  queryClient: ReturnType<typeof useQueryClient>,
  tournamentId: string
) {
  void queryClient.invalidateQueries({
    queryKey: ['lease', 'list', tournamentId],
  });
}

export function useArenaLease(args: {
  tournamentId: string | null;
  groupId: string | null;
  deviceId: string | undefined;
}) {
  const { tournamentId, groupId, deviceId } = args;
  const queryClient = useQueryClient();
  const { mutateAsync: arenaMutate } = useArenaMutation();
  const arenaMutateRef = React.useRef(arenaMutate);
  arenaMutateRef.current = arenaMutate;

  useLeaseStream(tournamentId ?? '');

  const leasesQuery = useLeases(tournamentId, deviceId);

  React.useEffect(() => {
    if (!tournamentId || !groupId || !deviceId) {
      return;
    }

    if (!leasesQuery.isFetched) {
      return;
    }

    const rowSnapshot = leasesQuery.data?.find((l) => l.groupId === groupId);
    const snapshotStatus = rowSnapshot?.leaseStatus;

    if (
      snapshotStatus === 'held_by_other' ||
      snapshotStatus === 'pending_takeover'
    ) {
      return;
    }

    let cancelled = false;
    let heartbeatId: number | undefined;
    let shouldReleaseOnCleanup = false;

    const clearHeartbeat = () => {
      if (heartbeatId != null) {
        window.clearInterval(heartbeatId);
        heartbeatId = undefined;
      }
    };

    void (async () => {
      let leaseReady = false;
      /** True only when we actually called acquire (not snapshot skip / idempotent). */
      let didCallAcquire = false;
      if (snapshotStatus === 'held_by_me') {
        leaseReady = true;
      } else {
        try {
          await client.lease.acquire({ groupId, deviceId });
          leaseReady = true;
          didCallAcquire = true;
        } catch (e) {
          let msg = '';
          if (e instanceof Error) {
            msg = e.message;
          } else if (
            typeof e === 'object' &&
            e !== null &&
            'message' in e &&
            typeof (e as { message: unknown }).message === 'string'
          ) {
            msg = (e as { message: string }).message;
          }
          if (msg.includes('already controlled by this device')) {
            leaseReady = true;
          } else if (!cancelled) {
            toast.error('Could not acquire group lease', {
              description: msg || 'Unknown error',
            });
            return;
          }
        }
      }

      if (!leaseReady) {
        return;
      }

      if (cancelled) {
        void arenaMutateRef
          .current({
            kind: 'lease.release',
            payload: { groupId, deviceId },
          })
          .catch(() => {});
        return;
      }

      if (didCallAcquire) {
        invalidateLeaseList(queryClient, tournamentId);
      }
      heartbeatId = window.setInterval(() => {
        void arenaMutateRef
          .current({
            kind: 'lease.heartbeat',
            payload: { groupId, deviceId },
          })
          .catch((e) => {
            const msg = e instanceof Error ? e.message : '';
            if (msg.includes('Lease is not held')) {
              clearHeartbeat();
              shouldReleaseOnCleanup = false;
            }
          });
      }, HEARTBEAT_MS);
      shouldReleaseOnCleanup = true;
    })();

    return () => {
      cancelled = true;
      clearHeartbeat();
      if (shouldReleaseOnCleanup) {
        void arenaMutateRef
          .current({
            kind: 'lease.release',
            payload: { groupId, deviceId },
          })
          .catch(() => {});
      }
    };
  }, [deviceId, groupId, leasesQuery.isFetched, queryClient, tournamentId]);

  const leaseRowDigest = React.useMemo(() => {
    const row = leasesQuery.data?.find((l) => l.groupId === groupId);
    if (!row) {
      return '';
    }
    return `${row.leaseStatus}:${row.takeoverRequests.map((r) => `${r.id}:${r.status}`).join(',')}`;
  }, [leasesQuery.data, groupId]);

  const prevLeaseStatus = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!tournamentId || !groupId || !deviceId || leaseRowDigest === '') {
      return;
    }

    const row = leasesQuery.data?.find((l) => l.groupId === groupId);
    if (!row) {
      return;
    }

    const status = row.leaseStatus;
    if (
      status === 'held_by_other' &&
      prevLeaseStatus.current !== 'held_by_other'
    ) {
      toast.message('This group is controlled by another device', {
        id: `lease-held-other-${groupId}`,
        description: 'You can request a takeover.',
        action: {
          label: 'Request takeover',
          onClick: () => {
            void client.lease
              .requestTakeover({ groupId, deviceId })
              .then(() => invalidateLeaseList(queryClient, tournamentId))
              .catch((e) => {
                toast.error('Takeover request failed', {
                  description: e instanceof Error ? e.message : undefined,
                });
              });
          },
        },
      });
    }

    if (status === 'held_by_me' && row.takeoverRequests.length > 0) {
      for (const req of row.takeoverRequests) {
        if (req.status !== 'pending') {
          continue;
        }
        toast('Takeover requested for this group', {
          id: `takeover-req-${req.id}`,
          description:
            'Approve to transfer control, or deny from the CRM Groups tab.',
          action: {
            label: 'Approve',
            onClick: () => {
              void client.lease
                .respondTakeover({
                  requestId: req.id,
                  approve: true,
                  deviceId,
                })
                .then(() => invalidateLeaseList(queryClient, tournamentId))
                .catch(() => {});
            },
          },
        });
      }
    }

    prevLeaseStatus.current = status;
  }, [deviceId, groupId, leaseRowDigest, queryClient, tournamentId]);
}
