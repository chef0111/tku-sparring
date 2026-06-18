import type { FilterItemSchema } from '@/lib/data-table/parsers';

export type ListAthleteProfilesQuery = {
  page: number;
  perPage: number;
  query?: string;
  name?: string;
  athleteCode?: string;
  gender?: Array<'M' | 'F'>;
  affiliation?: string;
  beltLevels?: Array<number>;
  beltLevelMin?: number;
  beltLevelMax?: number;
  weightMin?: number;
  weightMax?: number;
  sorting: Array<{ id: string; desc: boolean }>;
  filterFlag?: 'advancedFilters' | 'commandFilters';
  filters: Array<FilterItemSchema>;
  joinOperator: 'and' | 'or';
  excludeTournamentId?: string;
};

export type CreateProfileData = {
  athleteCode: string;
  name: string;
  gender: 'M' | 'F';
  beltLevel: number;
  weight: number;
  affiliation: string;
  image?: string;
};

export type UpdateProfileData = {
  athleteCode: string;
  name?: string;
  gender?: 'M' | 'F';
  beltLevel?: number;
  weight?: number;
  affiliation?: string;
  image?: string | null;
};

export type CreateProfileCommand = CreateProfileData & {
  confirmDuplicate?: boolean;
};

export type DedupQuery = {
  athleteCode: string;
  name: string;
  affiliation: string;
  beltLevel: number;
  weight: number;
  excludeId?: string;
};

export type BulkRemoveProfilesCommand = {
  ids: Array<string>;
};
