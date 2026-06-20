export interface AthleteProfileData {
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
}

export type AthleteRow = {
  id: string;
  athleteCode: string;
  name: string;
  gender: 'M' | 'F';
  beltLevel: number;
  weight: number;
  affiliation: string;
  image: string;
};
