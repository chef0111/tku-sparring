import { describe, expect, it } from 'vitest';

import { getNameSortKey } from './name-sort-key';

describe('getNameSortKey', () => {
  it('uses the last whitespace-delimited token, lowercased', () => {
    expect(getNameSortKey('Nguyen Thanh Binh')).toBe('binh');
    expect(getNameSortKey('Dang Thai Khang')).toBe('khang');
  });

  it('trims edges and collapses internal whitespace via split', () => {
    expect(getNameSortKey('  A B  ')).toBe('b');
  });

  it('returns empty string for blank names', () => {
    expect(getNameSortKey('')).toBe('');
    expect(getNameSortKey('   ')).toBe('');
  });
});
