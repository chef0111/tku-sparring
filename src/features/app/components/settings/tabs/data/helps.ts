export type KeyEntry = {
  label?: string;
  kbd?: string | (() => string);
  className?: string;
  labelClassName?: string;
  isSeparator?: boolean;
};

export const systemKeys: Array<KeyEntry> = [
  {
    label: 'Open settings dialog',
    kbd: () =>
      navigator.userAgent.toUpperCase().includes('MAC')
        ? '⌘ + comma'
        : 'Ctrl + comma',
  },
  {
    label: 'Close settings dialog',
    kbd: 'Esc',
  },
  {
    label: 'Apply settings',
    kbd: () =>
      navigator.userAgent.toUpperCase().includes('MAC')
        ? '⌘ + Enter'
        : 'Ctrl + Enter',
  },
  {
    label: 'Start/Stop Timer',
    kbd: 'Space',
  },
  {
    label: 'Undo player actions',
    kbd: () =>
      navigator.userAgent.toUpperCase().includes('MAC') ? '⌘ + Z' : 'Ctrl + Z',
  },
];

export const redKeys: Array<KeyEntry> = [
  { label: 'Foul (Penalty)', kbd: 'W' },
  { isSeparator: true },
  { label: 'Head Kick (Crit) - 5 pts', kbd: 'E' },
  { label: 'Trunk Kick (Crit) - 4 pts', kbd: 'Q' },
  { label: 'Head Kick - 3 pts', kbd: 'D' },
  { label: 'Trunk Kick - 2 pts', kbd: 'A' },
  { label: 'Punch - 1 pt', kbd: 'S' },
];

export const blueKeys: Array<KeyEntry> = [
  { label: 'Foul (Penalty)', kbd: 'I' },
  { isSeparator: true },
  { label: 'Head Kick (Crit) - 5 pts', kbd: 'U' },
  { label: 'Body Kick (Crit) - 4 pts', kbd: 'O' },
  { label: 'Head Kick - 3 pts', kbd: 'J' },
  { label: 'Body Kick - 2 pts', kbd: 'L' },
  { label: 'Punch - 1 pt', kbd: 'K' },
];

export default { systemKeys, redKeys, blueKeys };
