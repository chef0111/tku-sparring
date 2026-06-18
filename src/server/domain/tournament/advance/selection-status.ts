/**
 * Group `status` for Advance Settings (no `Group.status` column in DB).
 * - Tournament `completed` ⇒ every group `completed`.
 * - No matches in group ⇒ `draft`.
 * - Every match `complete` ⇒ `completed`.
 * - Tournament `active` and not all complete ⇒ `active`.
 * - Otherwise `draft`.
 */
export function deriveGroupStatusForSelectionView(
  tournamentStatus: string,
  matchStatuses: Array<string>
): 'draft' | 'active' | 'completed' {
  if (tournamentStatus === 'completed') {
    return 'completed';
  }
  if (matchStatuses.length === 0) {
    return 'draft';
  }
  const allComplete = matchStatuses.every((s) => s === 'complete');
  if (allComplete) {
    return 'completed';
  }
  if (tournamentStatus === 'active') {
    return 'active';
  }
  return 'draft';
}
