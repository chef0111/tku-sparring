import { createContext } from 'react';
import type { FlagConfig } from '@/config/flag';

export type FilterFlag = FlagConfig['featureFlags'][number]['value'];

export interface FeatureFlagsContextValue {
  filterFlag: FilterFlag | null;
  enableAdvancedFilter: boolean;
}

export const FeatureFlagsContext =
  createContext<FeatureFlagsContextValue | null>(null);
