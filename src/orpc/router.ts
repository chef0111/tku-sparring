import { tournamentRouter } from './tournaments/router';
import { divisionRouter } from './divisions/router';
import { bracketRouter, matchRouter } from './matches/router';
import { athleteProfileRouter } from './athlete-profiles/router';
import { tournamentAthleteRouter } from './tournament-athletes/router';
import { activityRouter } from './activity/router';
import { advanceSettingsRouter } from './advance-settings/router';
import { arenaMatchClaimRouter } from './arena-match-claim/router';
import { deviceLastSelectionRouter } from './device-last-selection/router';

export default {
  tournament: tournamentRouter,
  division: divisionRouter,
  match: matchRouter,
  bracket: bracketRouter,
  athleteProfile: athleteProfileRouter,
  tournamentAthlete: tournamentAthleteRouter,
  activity: activityRouter,
  advanceSettings: advanceSettingsRouter,
  arenaMatchClaim: arenaMatchClaimRouter,
  device: {
    lastSelection: deviceLastSelectionRouter,
  },
} as const;
