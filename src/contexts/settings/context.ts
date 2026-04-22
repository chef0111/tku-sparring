import { createContext } from 'react';

export type StandardFormData = {
  redPlayerAvatar: string | null;
  bluePlayerAvatar: string | null;
  redPlayerAvatarName: string | null;
  bluePlayerAvatarName: string | null;
  redPlayerName: string;
  bluePlayerName: string;
  roundDuration: number;
  breakDuration: number;
  maxHealth: number;
};

export type AdvanceFormData = StandardFormData & {
  tournament: string | null;
  group: string | null;
  match: string | null;
};

export type FormData = {
  standard: StandardFormData;
  advance: AdvanceFormData;
};

export type FormState = {
  isDirty: boolean;
  isValid: boolean;
};

export const defaultStandardFormData: StandardFormData = {
  redPlayerAvatar: null,
  bluePlayerAvatar: null,
  redPlayerAvatarName: null,
  bluePlayerAvatarName: null,
  redPlayerName: 'PLAYER A',
  bluePlayerName: 'PLAYER B',
  roundDuration: 60,
  breakDuration: 30,
  maxHealth: 120,
};

export const defaultAdvanceFormData: AdvanceFormData = {
  ...defaultStandardFormData,
  tournament: null,
  group: null,
  match: null,
};

export const defaultFormData: FormData = {
  standard: defaultStandardFormData,
  advance: defaultAdvanceFormData,
};

type SettingsContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleSettings: () => void;

  activeTab: 'standard' | 'advance';
  setActiveTab: (tab: 'standard' | 'advance') => void;

  formData: FormData;
  formState: FormState;
  updateStandardForm: (data: Partial<StandardFormData>) => void;
  updateAdvanceForm: (data: Partial<AdvanceFormData>) => void;
  setStandardFormState: (state: Partial<FormState>) => void;
  setAdvanceFormState: (state: Partial<FormState>) => void;

  applySettings: () => void;
};

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);
