import { describe, expect, it } from 'vitest';

import { getNormalizedEvents } from '../filter-options';

describe('getNormalizedEvents', () => {
  it('orders tournament before bracket and uses normalized labels', () => {
    const opts = getNormalizedEvents();
    expect(opts[0]?.value.startsWith('tournament.')).toBe(true);
    const bracketIdx = opts.findIndex((o) => o.value.startsWith('bracket.'));
    const tournamentIdx = opts.findIndex((o) =>
      o.value.startsWith('tournament.')
    );
    expect(tournamentIdx).toBeLessThan(bracketIdx);
    expect(
      opts.find((o) => o.value === 'tournament.status_change')?.label
    ).toBe('Tournament – Status change');
    expect(opts.find((o) => o.value === 'match.score_edit')?.label).toBe(
      'Match – Score edit'
    );
    expect(opts.find((o) => o.value === 'match.swap_participants')?.label).toBe(
      'Match – Swap participants'
    );
  });
});
