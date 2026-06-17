import type { CustomSlotInput } from '@/lib/tournament/custom-match-slots';

export type { CustomSlotInput as CustomSlotCommand };

export type CreateCustomMatchCommand = {
  groupId: string;
  displayLabel: string;
  red: CustomSlotInput;
  blue: CustomSlotInput;
  adminId: string;
};

export type DeleteCustomMatchCommand = {
  matchId: string;
  adminId: string;
};
