/**
 * Standard single-elimination seed order: slot index → seed number (1-based).
 * Pairing is (seed at 2i) vs (seed at 2i+1); BYEs use seeds N+1 … bracketSize.
 */
export function buildSlotMap(size: number): Array<number> {
  if (size < 2 || (size & (size - 1)) !== 0) {
    throw new Error(`bracket size must be a power of two, got ${size}`);
  }
  let seeds = [1, 2];
  while (seeds.length < size) {
    const next: Array<number> = [];
    const top = seeds.length * 2 + 1;
    for (const s of seeds) {
      next.push(s);
      next.push(top - s);
    }
    seeds = next;
  }
  return seeds;
}
