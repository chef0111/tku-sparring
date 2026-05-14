import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs';

const POOL_GENDER = parseAsStringEnum(['M', 'F']);
const TAB = parseAsStringEnum(['groups', 'brackets']).withDefault('groups');

export function useBuilderManagerQuery() {
  const [tab, setTab] = useQueryState('tab', TAB);
  const [selectedGroupId, setSelectedGroup] = useQueryState('group');
  const [poolQuery] = useQueryState('q');
  const [poolGender] = useQueryState('poolGender', POOL_GENDER);
  const [poolBeltMin] = useQueryState('poolBeltMin', parseAsInteger);
  const [poolBeltMax] = useQueryState('poolBeltMax', parseAsInteger);
  const [poolWeightMin] = useQueryState('poolWeightMin', parseAsInteger);
  const [poolWeightMax] = useQueryState('poolWeightMax', parseAsInteger);

  return {
    tab,
    setTab,
    selectedGroupId,
    setSelectedGroup,
    poolQuery,
    poolGender,
    poolBeltMin,
    poolBeltMax,
    poolWeightMin,
    poolWeightMax,
  };
}
