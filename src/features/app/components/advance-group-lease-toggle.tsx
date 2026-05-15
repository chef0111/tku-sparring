import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  IconLoader2,
  IconLock,
  IconLockOpen,
  IconPlugConnected,
} from '@tabler/icons-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { useDeviceId } from '@/hooks/use-device-id';
import { useSettings } from '@/contexts/settings';
import { client } from '@/orpc/client';
import { invalidateLeaseQueries, useLeases } from '@/queries/leases';

type LeaseUiStatus =
  | 'available'
  | 'held_by_me'
  | 'held_by_other'
  | 'pending_takeover';

function leaseRpcMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  if (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    typeof (e as { message: unknown }).message === 'string'
  ) {
    return (e as { message: string }).message;
  }
  return '';
}

/**
 * Toggles `lease.acquire` / `lease.release` for the Advance tab’s selected group.
 */
export function AdvanceGroupLeaseToggle() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const deviceId = useDeviceId();
  const { formData } = useSettings();
  const { tournament, group } = formData.advance;

  const leasesQuery = useLeases(
    session?.user ? tournament : null,
    session?.user ? deviceId : undefined
  );

  const leaseRow = leasesQuery.data?.find((l) => l.groupId === group);
  const status: LeaseUiStatus = leaseRow?.leaseStatus ?? 'available';

  const [busy, setBusy] = React.useState(false);

  /** Match `useArenaLease`: avoid acquire/release until the list has been fetched once. */
  const snapshotReady =
    Boolean(session?.user && tournament && deviceId) && leasesQuery.isFetched;

  const listLoading =
    Boolean(session?.user && tournament && deviceId) && !leasesQuery.isFetched;

  if (!session?.user || !tournament || !group || !deviceId) {
    return null;
  }

  const canAcquire = snapshotReady && status === 'available';
  const canRelease = snapshotReady && status === 'held_by_me';
  const blocked =
    snapshotReady &&
    (status === 'held_by_other' || status === 'pending_takeover');

  const disabled = busy || listLoading || blocked;

  const title = canRelease
    ? 'Release group lease'
    : canAcquire
      ? 'Acquire group lease'
      : blocked
        ? 'Group lease unavailable (another device)'
        : 'Lease status loading';

  const handleClick = () => {
    if (disabled) {
      return;
    }
    setBusy(true);
    void (async () => {
      try {
        if (canRelease) {
          await client.lease.release({ groupId: group, deviceId });
          toast.success('Released control of this group');
        } else {
          try {
            await client.lease.acquire({ groupId: group, deviceId });
          } catch (e) {
            const msg = leaseRpcMessage(e);
            if (!msg.includes('already controlled by this device')) {
              throw e;
            }
          }
          toast.success('Acquired control of this group');
        }
        await invalidateLeaseQueries(queryClient, tournament);
      } catch (e) {
        toast.error(
          canRelease ? 'Could not release lease' : 'Could not acquire lease',
          {
            description: leaseRpcMessage(e) || undefined,
          }
        );
      } finally {
        setBusy(false);
      }
    })();
  };

  const icon = listLoading ? (
    <IconLoader2 className="animate-spin" />
  ) : canRelease ? (
    <IconLockOpen />
  ) : canAcquire ? (
    <IconPlugConnected />
  ) : (
    <IconLock />
  );

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="shrink-0"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={handleClick}
    >
      {icon}
    </Button>
  );
}
