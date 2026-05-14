import { TOURNAMENT_ACTIVITY_EVENT_TYPES } from './event-types';
import type { TournamentActivityEventType } from './event-types';

const CATEGORY_ORDER = [
  'tournament',
  'bracket',
  'match',
  'group',
  'lease',
] as const;

export type ActivityEventFilterOption = {
  value: TournamentActivityEventType;
  label: string;
};

export function getNormalizedEvents(): Array<ActivityEventFilterOption> {
  const sorted = [...TOURNAMENT_ACTIVITY_EVENT_TYPES].sort((a, b) => {
    const [ca] = a.split('.');
    const [cb] = b.split('.');
    const ia = CATEGORY_ORDER.indexOf(ca as (typeof CATEGORY_ORDER)[number]);
    const ib = CATEGORY_ORDER.indexOf(cb as (typeof CATEGORY_ORDER)[number]);
    const rankA = ia === -1 ? CATEGORY_ORDER.length : ia;
    const rankB = ib === -1 ? CATEGORY_ORDER.length : ib;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.localeCompare(b);
  });

  return sorted.map((value) => ({
    value,
    label: formatEventLabel(value),
  }));
}

function formatEventLabel(eventType: TournamentActivityEventType): string {
  const dot = eventType.indexOf('.');
  if (dot === -1) {
    return eventType;
  }
  const category = eventType.slice(0, dot);
  const action = eventType.slice(dot + 1);
  return `${formatFilterCategory(category)} – ${formatFilterAction(action)}`;
}

function formatFilterCategory(segment: string): string {
  if (!segment) {
    return segment;
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
}

/** `status_change` → `Status change` (sentence-style after the first word). */
function formatFilterAction(snake: string): string {
  const parts = snake.split('_').filter(Boolean);
  if (parts.length === 0) {
    return snake;
  }
  return parts
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase()
    )
    .join(' ');
}
