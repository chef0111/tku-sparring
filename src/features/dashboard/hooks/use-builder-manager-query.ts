import {
  parseAsBoolean,
  parseAsInteger,
  parseAsStringEnum,
  useQueryState,
} from 'nuqs';

const POOL_GENDER = parseAsStringEnum(['M', 'F']);
const TAB = parseAsStringEnum(['divisions', 'brackets']).withDefault(
  'divisions'
);
const ADD_ATHLETES = parseAsBoolean;

export function useBuilderManagerQuery() {
  const [tab, setTab] = useQueryState('tab', TAB);
  const [selectedDivisionId, setSelectedDivision] = useQueryState('division');
  const [poolQuery] = useQueryState('q');
  const [poolGender] = useQueryState('poolGender', POOL_GENDER);
  const [poolBeltMin] = useQueryState('poolBeltMin', parseAsInteger);
  const [poolBeltMax] = useQueryState('poolBeltMax', parseAsInteger);
  const [poolWeightMin] = useQueryState('poolWeightMin', parseAsInteger);
  const [poolWeightMax] = useQueryState('poolWeightMax', parseAsInteger);
  const [addAthletes, setAddAthletes] = useQueryState(
    'addAthletes',
    ADD_ATHLETES
  );

  return {
    tab,
    setTab,
    selectedDivisionId,
    setSelectedDivision,
    poolQuery,
    poolGender,
    poolBeltMin,
    poolBeltMax,
    poolWeightMin,
    poolWeightMax,
    addAthletes,
    setAddAthletes,
  };
}
