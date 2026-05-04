export const BELT_LEVELS = [
  { value: 0, label: 'White' },
  { value: 1, label: 'White II' },
  { value: 2, label: 'White Yellow' },
  { value: 3, label: 'Yellow' },
  { value: 4, label: 'Green' },
  { value: 5, label: 'Blue' },
  { value: 6, label: 'Red IV' },
  { value: 7, label: 'Red III' },
  { value: 8, label: 'Red II' },
  { value: 9, label: 'Red I' },
  { value: 10, label: 'Black' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
] as const;

export function getBeltLabel(beltLevel: number): string {
  return (
    BELT_LEVELS.find((b) => b.value === beltLevel)?.label ?? `Belt ${beltLevel}`
  );
}

export function getGenderLabel(gender: string): string {
  return GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? gender;
}
