function payloadObject(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
}

export function summarizeTournamentActivity(
  eventType: string,
  payload: unknown
): string {
  const p = payloadObject(payload);
  switch (eventType) {
    case 'tournament.status_change': {
      const forced = p.forced === true ? ' (admin override)' : '';
      return `Tournament status changed from ${String(p.fromStatus)} to ${String(p.toStatus)}${forced}`;
    }
    case 'tournament.delete':
      return 'Tournament deleted';
    case 'bracket.generate':
      return `Bracket generated (${String(p.mode ?? 'full')})`;
    case 'bracket.reset':
      return 'Bracket reset (fresh shuffle)';
    case 'bracket.shuffle':
      return 'Bracket shuffled';
    case 'bracket.regenerate':
      return 'Bracket regenerated';
    case 'match.score_edit':
      return `Match score updated (${String(p.redWins ?? '?')}-${String(p.blueWins ?? '?')})`;
    case 'match.winner_override':
      return `Winner manually set (${String(p.winnerSide ?? '')})`;
    case 'match.status_admin':
      return `Match status set to ${String(p.toStatus ?? '')}${p.clearedScores === true ? ' (scores cleared)' : ''}`;
    case 'match.swap_participants':
      return 'Match participants swapped';
    case 'match.create_custom':
      return `Custom match created (${String(p.displayLabel ?? '')})`;
    case 'match.delete_custom':
      return `Custom match deleted (${String(p.displayLabel ?? '')})`;
    case 'division.athlete_assigned':
      return `Assigned ${String(p.name ?? 'athlete')} to a group`;
    case 'division.athlete_unassigned':
      return `Unassigned ${String(p.name ?? 'athlete')} from a group`;
    case 'division.auto_assign':
      return `Auto-assigned ${String(p.count ?? 0)} athlete(s) to a group`;
    default:
      return eventType.replace(/\./g, ' ');
  }
}
