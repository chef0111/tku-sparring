import type { CustomSlotInput } from '@/server/domain/tournament/custom/types';

export type { CustomSlotInput as CustomSlotCommand };

export type CreateCustomMatchCommand = {
  divisionId: string;
  displayLabel: string;
  red: CustomSlotInput;
  blue: CustomSlotInput;
  adminId: string;
};

export type DeleteCustomMatchCommand = {
  matchId: string;
  adminId: string;
};
