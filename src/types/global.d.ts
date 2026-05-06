type Player = 'red' | 'blue';

interface Tournament {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  tournamentId: string;
}

interface Match {
  id: string;
  name: string;
  groupId: string;
  redAthlete: Athlete;
  blueAthlete: Athlete;
}

interface Athlete {
  id: string;
  name: string;
  avatar: string | null;
}
