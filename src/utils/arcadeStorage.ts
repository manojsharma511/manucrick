import type { ArcadeGameId } from '../data/arcadeGames';

const ARCADE_SCORE_KEY = 'manucrick_arcade_scores';
const ARCADE_PLAY_KEY = 'manucrick_arcade_play_counts';

export interface ArcadeScoreRecord {
  id: string;
  gameId: ArcadeGameId;
  gameTitle: string;
  score: number;
  durationSeconds: number;
  createdAt: string;
}

type PlayCountMap = Partial<Record<ArcadeGameId, number>>;

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const getArcadeScores = (): ArcadeScoreRecord[] => {
  return safeParse<ArcadeScoreRecord[]>(localStorage.getItem(ARCADE_SCORE_KEY), []);
};

export const saveArcadeScore = (payload: Omit<ArcadeScoreRecord, 'id' | 'createdAt'>) => {
  const existing = getArcadeScores();
  const record: ArcadeScoreRecord = {
    id: `${payload.gameId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  const next = [record, ...existing].slice(0, 200);
  localStorage.setItem(ARCADE_SCORE_KEY, JSON.stringify(next));
  return record;
};

export const getArcadePlayCounts = (): PlayCountMap => {
  return safeParse<PlayCountMap>(localStorage.getItem(ARCADE_PLAY_KEY), {});
};

export const incrementArcadePlayCount = (gameId: ArcadeGameId) => {
  const counts = getArcadePlayCounts();
  const current = counts[gameId] ?? 0;
  const next: PlayCountMap = {
    ...counts,
    [gameId]: current + 1,
  };
  localStorage.setItem(ARCADE_PLAY_KEY, JSON.stringify(next));
  return next;
};

export const getArcadeBestScoreByGame = () => {
  const scores = getArcadeScores();
  const best: Partial<Record<ArcadeGameId, number>> = {};

  scores.forEach((score) => {
    const currentBest = best[score.gameId] ?? 0;
    if (score.score > currentBest) {
      best[score.gameId] = score.score;
    }
  });

  return best;
};

export interface ArcadeSummary {
  totalSessions: number;
  totalPlayCount: number;
  topScore: number;
  topPlayedGameId: ArcadeGameId | null;
}

export const getArcadeSummary = (): ArcadeSummary => {
  const scores = getArcadeScores();
  const counts = getArcadePlayCounts();
  const countEntries = Object.entries(counts) as [ArcadeGameId, number][];

  let topPlayedGameId: ArcadeGameId | null = null;
  let topPlayedCount = 0;

  countEntries.forEach(([gameId, count]) => {
    if (count > topPlayedCount) {
      topPlayedCount = count;
      topPlayedGameId = gameId;
    }
  });

  const topScore = scores.reduce((max, item) => Math.max(max, item.score), 0);
  const totalPlayCount = countEntries.reduce((acc, [, count]) => acc + count, 0);

  return {
    totalSessions: scores.length,
    totalPlayCount,
    topScore,
    topPlayedGameId,
  };
};
