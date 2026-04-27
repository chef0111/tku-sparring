export const avatarGroup = [
  {
    label: 'PLAYER 1 AVATAR',
    name: 'redPlayerAvatar' as const,
    playerName: 'Red Player',
    className: 'bg-red-player  relative size-25 rounded-xl!',
    fallback: 'assets/CapybaraTKU1.webp',
  },
  {
    label: 'PLAYER 2 AVATAR',
    name: 'bluePlayerAvatar' as const,
    playerName: 'Blue Player',
    className: 'bg-blue-player  relative size-25 rounded-xl!',
    fallback: 'assets/CapybaraTKU2.webp',
  },
];

export const playerGroup = [
  {
    name: 'redPlayerName' as const,
    label: 'RED PLAYER NAME',
    placeholder: 'Enter Red Player Name',
  },
  {
    name: 'bluePlayerName' as const,
    label: 'BLUE PLAYER NAME',
    placeholder: 'Enter Blue Player Name',
  },
];

export const durationGroup = [
  {
    name: 'roundDuration' as const,
    label: 'ROUND DURATION (s)',
  },
  {
    name: 'breakDuration' as const,
    label: 'BREAK DURATION (s)',
  },
];

export const advancePlayerGroup = [
  {
    label: 'RED ATHLETE',
    nameAvatar: 'redPlayerAvatar' as const,
    namePlayer: 'redPlayerName' as const,
    playerName: 'PLAYER A',
    className: 'bg-red-player  relative size-25 rounded-xl!',
    fallback: 'assets/CapybaraTKU1.webp',
  },
  {
    label: 'BLUE ATHLETE',
    nameAvatar: 'bluePlayerAvatar' as const,
    namePlayer: 'bluePlayerName' as const,
    playerName: 'PLAYER B',
    className: 'bg-blue-player  relative size-25 rounded-xl!',
    fallback: 'assets/CapybaraTKU2.webp',
  },
];

type ComboboxOption = {
  value: string;
  label: string;
};

export const getTournamentFields = (
  tournamentOptions: Array<ComboboxOption>,
  groupOptions: Array<ComboboxOption>,
  matchOptions: Array<ComboboxOption>,
  groupsDisabled: boolean,
  matchesDisabled: boolean
) => [
  {
    name: 'tournament' as const,
    data: tournamentOptions,
    type: 'tournaments',
    label: 'SELECT TOURNAMENT',
    disabled: false,
  },
  {
    name: 'group' as const,
    data: groupOptions,
    type: 'groups',
    label: 'SELECT GROUP',
    disabled: groupsDisabled,
  },
  {
    name: 'match' as const,
    data: matchOptions,
    type: 'matches',
    label: 'SELECT MATCH',
    disabled: matchesDisabled,
  },
];
