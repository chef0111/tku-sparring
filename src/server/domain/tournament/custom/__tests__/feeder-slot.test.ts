import { describe, expect, it } from 'vitest';

import { resolveFeederSlotId } from '@/server/domain/tournament/custom/feeder-slot';

function feeder(over: Record<string, unknown> = {}) {
  return {
    kind: 'bracket',
    status: 'complete',
    redTournamentAthleteId: 'ta-red',
    blueTournamentAthleteId: 'ta-blue',
    tournamentWinnerId: 'ta-red',
    ...over,
  };
}

describe('resolveFeederSlotId', () => {
  it('resolves winner slots', () => {
    expect(resolveFeederSlotId(feeder(), 'winner')).toBe('ta-red');
  });

  it('resolves loser slots', () => {
    expect(resolveFeederSlotId(feeder(), 'loser')).toBe('ta-blue');
  });

  it('rejects incomplete feeders', () => {
    expect(() =>
      resolveFeederSlotId(feeder({ status: 'pending' }), 'winner')
    ).toThrow(/must be complete/);
  });

  it('rejects custom feeders', () => {
    expect(() =>
      resolveFeederSlotId(feeder({ kind: 'custom' }), 'winner')
    ).toThrow(/custom matches cannot be feeders/);
  });

  it('rejects winner ids that do not match a feeder corner', () => {
    expect(() =>
      resolveFeederSlotId(feeder({ tournamentWinnerId: 'ta-other' }), 'loser')
    ).toThrow(/Winner does not match/);
  });
});
