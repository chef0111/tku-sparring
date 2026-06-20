import { describe, expect, it } from 'vitest';

import { summarizeTournamentActivity } from '../summarize';

describe('summarizeTournamentActivity', () => {
  it('describes status change', () => {
    expect(
      summarizeTournamentActivity('tournament.status_change', {
        fromStatus: 'draft',
        toStatus: 'active',
      })
    ).toContain('draft');
  });

  it('describes auto-assign count', () => {
    expect(
      summarizeTournamentActivity('division.auto_assign', { count: 5 })
    ).toContain('5');
  });
});
