export type ArcadeGameId =
  | 'car-racing'
  | 'bike-racing'
  | 'zombie-survival'
  | 'city-heist-chase'
  | 'offroad-rally'
  | 'neon-runner';

export interface ArcadeGameMeta {
  id: ArcadeGameId;
  title: string;
  genre: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  keyboardControls: string[];
  touchControls: string[];
  accent: string;
  emoji: string;
}

export const ARCADE_GAMES: ArcadeGameMeta[] = [
  {
    id: 'car-racing',
    title: 'Neon Car Racing',
    genre: 'Racing',
    difficulty: 'Medium',
    description:
      'Switch lanes at high speed, dodge traffic, and survive as the highway gets faster every minute.',
    keyboardControls: ['← / → Move lanes', 'Space Pause / Resume', 'R Restart after crash'],
    touchControls: ['Left / Right lane buttons', 'Pause button', 'Restart button'],
    accent: '#00FF87',
    emoji: '🏎️',
  },
  {
    id: 'bike-racing',
    title: 'Street Bike Rush',
    genre: 'Racing',
    difficulty: 'Medium',
    description:
      'Thread through tight traffic, collect nitro packs, and use boost wisely to keep your streak alive.',
    keyboardControls: ['← / → Steer', 'Shift Boost', 'Space Pause / Resume'],
    touchControls: ['Left / Right steering buttons', 'Boost button', 'Pause button'],
    accent: '#10B981',
    emoji: '🏍️',
  },
  {
    id: 'zombie-survival',
    title: 'Zombie Survival Arena',
    genre: 'Survival',
    difficulty: 'Hard',
    description:
      'Move, aim, and survive endless zombie waves while collecting health and ammo pickups under pressure.',
    keyboardControls: ['WASD / Arrows Move', 'Space Fire', 'P Pause / Resume'],
    touchControls: ['Virtual D-pad movement', 'Fire button', 'Pause button'],
    accent: '#FFD700',
    emoji: '🧟',
  },
  {
    id: 'city-heist-chase',
    title: 'City Heist Chase',
    genre: 'Action',
    difficulty: 'Hard',
    description:
      'GTA-style top-down city chase: collect cash, raise heat, and evade patrol units as pressure escalates.',
    keyboardControls: ['WASD / Arrows Drive', 'Space Brake', 'P Pause / Resume'],
    touchControls: ['Steering pad', 'Brake button', 'Pause button'],
    accent: '#FF6B00',
    emoji: '🚓',
  },
  {
    id: 'offroad-rally',
    title: 'Offroad Rally Run',
    genre: 'Rally',
    difficulty: 'Easy',
    description:
      'Navigate rough terrain, hit checkpoints before time runs out, and keep your rally machine stable.',
    keyboardControls: ['← / → Steering', 'Space Handbrake', 'P Pause / Resume'],
    touchControls: ['Left / Right steering buttons', 'Brake button', 'Pause button'],
    accent: '#7DD3FC',
    emoji: '🚙',
  },
  {
    id: 'neon-runner',
    title: 'Cyber Runner Ninja',
    genre: 'Platformer',
    difficulty: 'Hard',
    description:
      'Slide, jump, and dash over lasers, buzzsaws, and drones in a retro cyberpunk neon skyline runner.',
    keyboardControls: ['W / ↑ Jump', 'S / ↓ Slide', 'Space Pause / Resume'],
    touchControls: ['Jump button', 'Slide button', 'Pause button'],
    accent: '#A855F7',
    emoji: '🥷',
  },
];

export const ARCADE_GAME_MAP: Record<ArcadeGameId, ArcadeGameMeta> = ARCADE_GAMES.reduce(
  (acc, game) => {
    acc[game.id] = game;
    return acc;
  },
  {} as Record<ArcadeGameId, ArcadeGameMeta>,
);
