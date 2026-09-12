export type PublicMatchMember = {
  displayName: string;
  role: string | null;
};

export type PublicMatchCompetitor = {
  id: string;
  displayName: string;
  institutionPublic: string | null;
  members: PublicMatchMember[];
};

export type PublicMatchTimer = {
  kind: string;
  kindLabel: string;
  status: string;
  statusLabel: string;
  durationSeconds: number;
  remainingSeconds: number | null;
};

export type PublicScoreBreakdown = {
  criterionId: string;
  criterionName: string;
  weight: number | null;
  teamAScore: string | null;
  teamBScore: string | null;
};

export type PublicMatchDetail = {
  id: string;
  code: string;
  round: {
    id: string;
    displayName: string;
    order: number;
  };
  status: string;
  scheduledAt: string | null;
  actualStartedAt: string | null;
  actualEndedAt: string | null;
  durationMs: number | null;
  competitorA: PublicMatchCompetitor | null;
  competitorB: PublicMatchCompetitor | null;
  winner: {
    id: string;
    displayName: string;
  } | null;
  isFinalRound: boolean;
  timers: PublicMatchTimer[];
  scoresVisible: boolean;
  scoresComplete: boolean;
  scoreBreakdown: PublicScoreBreakdown[];
  totals: {
    teamA: string;
    teamB: string;
  } | null;
  updatedAt: string;
};
