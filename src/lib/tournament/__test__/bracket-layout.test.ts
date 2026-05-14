import { describe, expect, it } from 'vitest';
import { buildConnectorChildLeg, buildConnectorTrunk } from '../bracket-layout';

describe('buildConnectorChildLeg', () => {
  it('uses a single arc at the child-side corner', () => {
    const d = buildConnectorChildLeg(100, 50, 200, 150, 8);
    expect((d.match(/A /g) ?? []).length).toBe(1);
    expect(d).toMatch(/^M /);
    expect(d).toContain('L 200 150');
  });

  it('falls back to straight line when vertical span negligible', () => {
    const d = buildConnectorChildLeg(100, 50, 200, 50, 8);
    expect(d).toBe('M 100 50 L 200 50');
  });
});

describe('buildConnectorTrunk', () => {
  it('draws one horizontal segment', () => {
    expect(buildConnectorTrunk(200, 150, 280)).toBe('M 200 150 L 280 150');
  });
});
