export type GroupLeaseUiStatus =
  | 'available'
  | 'held_by_me'
  | 'held_by_other'
  | 'pending_takeover';

/**
 * Maps an active lease row (or none) to UI status for a requesting device.
 * When `lease` is null the group has no active lease after cleanup.
 */
export function resolveGroupLeaseStatus(
  deviceId: string | undefined,
  lease: {
    deviceId: string;
    takeoverRequests: Array<{ requesterDeviceId: string }>;
  } | null
): GroupLeaseUiStatus {
  if (!lease) {
    return 'available';
  }
  if (deviceId && lease.deviceId === deviceId) {
    return 'held_by_me';
  }
  if (
    deviceId &&
    lease.takeoverRequests.some((r) => r.requesterDeviceId === deviceId)
  ) {
    return 'pending_takeover';
  }
  return 'held_by_other';
}
