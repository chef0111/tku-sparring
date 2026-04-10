export type HitType =
  | 'headCrit' // 6 points - 30 damage
  | 'trunkCrit' // 4 points - 20 damage
  | 'head' // 3 points - 15 damage
  | 'trunk' // 2 points - 10 damage
  | 'punch'; // 1 point - 5 damage

export type Player = 'red' | 'blue';

export const hitDamage: Record<HitType, number> = {
  headCrit: 30,
  trunkCrit: 20,
  head: 15,
  trunk: 10,
  punch: 5,
};

export const hitPoints: Record<HitType, number> = {
  headCrit: 6,
  trunkCrit: 4,
  head: 3,
  trunk: 2,
  punch: 1,
};

export const hitCooldown = 300;

export const getHitIconPath = (player: Player, hitType: HitType): string => {
  const iconMap: Record<HitType, string> = {
    headCrit: `${player}HeadCrit`,
    trunkCrit: `${player}TrunkCrit`,
    head: `${player}Head`,
    trunk: `${player}Trunk`,
    punch: `${player}Punch`,
  };

  return `/assets/${iconMap[hitType]}.webp`;
};

// Button icons
export const getButtonIconPath = (player: Player, hitType: HitType): string => {
  const iconMap: Record<HitType, string> = {
    headCrit: `${player}HeadCritButton`,
    trunkCrit: `${player}TrunkCritButton`,
    head: `${player}HeadButton`,
    trunk: `${player}TrunkButton`,
    punch: `${player}PunchButton`,
  };

  return `/assets/${iconMap[hitType]}.webp`;
};

export const keyboardMappings: Record<Player, Record<string, HitType>> = {
  red: {
    e: 'headCrit',
    q: 'trunkCrit',
    d: 'head',
    a: 'trunk',
    s: 'punch',
  },
  blue: {
    u: 'headCrit',
    o: 'trunkCrit',
    j: 'head',
    l: 'trunk',
    k: 'punch',
  },
};

export const isCriticalHit = (hitType: HitType): boolean => {
  return hitType === 'headCrit' || hitType === 'trunkCrit';
};

export const isSuperCriticalHit = (hitType: HitType): boolean => {
  return hitType === 'headCrit';
};

export const criticalHits: Array<HitType> = ['headCrit', 'trunkCrit'];
export const normalHits: Array<HitType> = ['head', 'punch', 'trunk'];
