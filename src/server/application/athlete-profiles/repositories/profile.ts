import type {
  BulkRemoveProfilesCommand,
  CreateProfileData,
  DedupQuery,
  ListAthleteProfilesQuery,
  UpdateProfileData,
} from '../use-cases/profile-commands';

export type AthleteProfileRow = {
  id: string;
  athleteCode: string | null;
  name: string;
  gender: string;
  beltLevel: number;
  weight: number;
  affiliation: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AthleteProfileListItem = {
  id: string;
  athleteCode: string;
  name: string;
  gender: string;
  beltLevel: number;
  weight: number;
  affiliation: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListAthleteProfilesResult = {
  items: Array<AthleteProfileListItem>;
  total: number;
};

export type DedupMatch = {
  id: string;
  name: string;
  affiliation: string;
};

export type AthleteProfileStore = {
  list: (query: ListAthleteProfilesQuery) => Promise<ListAthleteProfilesResult>;
  findById: (id: string) => Promise<AthleteProfileRow | null>;
  findByAthleteCodeAndName: (
    athleteCode: string,
    name: string,
    excludeId?: string
  ) => Promise<DedupMatch | null>;
  findPossibleDuplicates: (
    query: Omit<DedupQuery, 'athleteCode'>
  ) => Promise<Array<DedupMatch>>;
  create: (data: CreateProfileData) => Promise<AthleteProfileRow>;
  update: (id: string, data: UpdateProfileData) => Promise<AthleteProfileRow>;
  remove: (id: string) => Promise<AthleteProfileRow>;
  bulkRemove: (command: BulkRemoveProfilesCommand) => Promise<number>;
};
