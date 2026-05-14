import { describe, expect, it } from 'vitest';

import { resolveGroupLeaseStatus } from '../lease-status';

describe('resolveGroupLeaseStatus', () => {
  it('returns available when there is no lease', () => {
    expect(resolveGroupLeaseStatus('dev-1', null)).toBe('available');
  });

  it('returns held_by_me when device matches lease holder', () => {
    expect(
      resolveGroupLeaseStatus('dev-1', {
        deviceId: 'dev-1',
        takeoverRequests: [],
      })
    ).toBe('held_by_me');
  });

  it('returns held_by_other when another device holds the lease', () => {
    expect(
      resolveGroupLeaseStatus('dev-1', {
        deviceId: 'dev-2',
        takeoverRequests: [],
      })
    ).toBe('held_by_other');
  });

  it('returns pending_takeover when this device requested takeover', () => {
    expect(
      resolveGroupLeaseStatus('dev-1', {
        deviceId: 'dev-2',
        takeoverRequests: [{ requesterDeviceId: 'dev-1' }],
      })
    ).toBe('pending_takeover');
  });

  it('treats missing deviceId as held_by_other when a lease exists', () => {
    expect(
      resolveGroupLeaseStatus(undefined, {
        deviceId: 'dev-2',
        takeoverRequests: [],
      })
    ).toBe('held_by_other');
  });
});
