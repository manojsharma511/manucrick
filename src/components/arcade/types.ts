import type { ArcadeGameMeta } from '../../data/arcadeGames';

export interface ArcadeGameComponentProps {
  meta: ArcadeGameMeta;
  onExit: () => void;
  onSessionRecorded: () => void;
}
