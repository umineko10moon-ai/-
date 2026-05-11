export interface Verb {
  infinitive: string;
  meaning: string;
  conjugations: {
    [subject: string]: string;
  };
}

export type Subject = 'ich' | 'du' | 'er/sie/es' | 'wir' | 'ihr' | 'sie/Sie';

export interface Enemy {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  infinitive: string;
  subject: Subject;
  correctAnswer: string;
  currentInput: string;
  distance: number;
  active: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export type GameMode = 'shooter' | 'practice';

export interface GameState {
  score: number;
  health: number;
  enemies: Enemy[];
  particles: Particle[];
  gameOver: boolean;
  gameStarted: boolean;
  level: number;
  mode: GameMode;
  currentPracticeVerb?: Verb;
  currentPracticeSubject?: Subject;
  streak: number;
  message?: string;
  isSkipping?: boolean;
  showingTutorial?: boolean;
}
