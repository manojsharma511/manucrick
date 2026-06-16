import type { ArcadeGameMeta } from '../../data/arcadeGames';
import { getArcadeBestScoreByGame, incrementArcadePlayCount, saveArcadeScore } from '../../utils/arcadeStorage';

export const getBestScoreForGame = (gameId: ArcadeGameMeta['id']) => {
  const bestMap = getArcadeBestScoreByGame();
  return bestMap[gameId] ?? 0;
};

export const markGameSessionStarted = (gameId: ArcadeGameMeta['id']) => {
  incrementArcadePlayCount(gameId);
};

export const persistArcadeGameResult = (
  meta: ArcadeGameMeta,
  score: number,
  startedAtMs: number,
  onSessionRecorded: () => void,
) => {
  const durationSeconds = Math.max(1, Math.floor((Date.now() - startedAtMs) / 1000));
  saveArcadeScore({
    gameId: meta.id,
    gameTitle: meta.title,
    score: Math.max(0, Math.floor(score)),
    durationSeconds,
  });
  onSessionRecorded();
};
