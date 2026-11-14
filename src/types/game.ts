export type GameStatus =
  | 'TITLE_MENU'
  | 'STORY_INTRO'
  | 'PLAYING'
  | 'PAUSED'
  | 'QUIZ_MODAL'
  | 'LEVEL_COMPLETE'
  | 'BETWEEN_LEVEL_MINIGAME'
  | 'GAME_OVER'
  | 'VICTORY';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  highestLevel: number;
  bossDefeated: boolean;
  quizCorrect: number;
  quizTotal: number;
  updatedAt: string;
  uid?: string;
}

export type SubstanceCategory =
  | 'PEWARNA_ALAMI'
  | 'PEMANIS_ALAMI'
  | 'PENGAWET_ALAMI'
  | 'PENYEDAP_ALAMI'
  | 'PELINDUNG_ALAMI'
  | 'ADITIF_BERBAHAYA'
  | 'ZAT_ADIKTIF';

export interface SubstanceEntry {
  id: string;
  name: string;
  shortLabel: string;
  category: SubstanceCategory;
  isSafe: boolean;
  points: number;
  role: string;
  description: string;
  impact: string;
  color: string;
  accentColor: string;
  iconType:
    | 'kunyit'
    | 'suji'
    | 'gula_aren'
    | 'stevia'
    | 'jeruk'
    | 'garam'
    | 'bawang'
    | 'buah_naga'
    | 'vitamin'
    | 'kapsul'
    | 'rhodamin'
    | 'methanil'
    | 'formalin'
    | 'boraks'
    | 'siklamat'
    | 'nikotin'
    | 'alkohol'
    | 'tar';
}

export interface QuizQuestion {
  id: string;
  levelHint?: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TilePlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'ground' | 'brick' | 'pipe' | 'stone' | 'bridge';
}

export interface QuestionBlock {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  used: boolean;
  bumpOffset: number;
  reward: 'quiz' | 'vitamin' | 'ammo';
  respawnTimer?: number;
}

export interface CollectibleItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  substanceId: string;
  collected: boolean;
  bobPhase: number;
  isAmmo?: boolean;
  vy?: number;
}

export interface EnemyEntity {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  minX: number;
  maxX: number;
  substanceId: string;
  defeated: boolean;
  canStomp: boolean;
  patrolType: 'walk' | 'bounce' | 'float';
  baseY: number;
  animPhase: number;
}

export interface BossState {
  active: boolean;
  defeated: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  state: 'PATROL' | 'CHARGE' | 'VULNERABLE' | 'HURT' | 'JUMPING';
  stateTimer: number;
  attackCooldown: number;
  hitFlash: number;
  arenaLockX: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fromPlayer: boolean;
  label: string;
  color: string;
  substanceId?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  hp: number;
  maxHp: number;
  hasShield: boolean;
  ammo: number;
  invincibleTimer: number;
  walkFrame: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
}

export interface LevelConfig {
  id: number;
  title: string;
  subtitle: string;
  topicFocus: string;
  theme: 'meadow' | 'city' | 'castle';
  worldWidth: number;
  worldHeight: number;
  goalX: number | null; // null on boss level (defeat boss to win)
  bossArenaX?: number;
  platforms: TilePlatform[];
  questionBlocks: QuestionBlock[];
  collectibles: CollectibleItem[];
  enemies: EnemyEntity[];
  bossTemplate?: Omit<BossState, 'active' | 'defeated'>;
}

export interface DiscoveryBanner {
  id: string;
  title: string;
  categoryLabel: string;
  description: string;
  isSafe: boolean;
  pointsDelta: number;
}

export interface SessionStats {
  score: number;
  safeCollected: Record<string, number>;
  hazardsHit: number;
  enemiesStomped: number;
  quizCorrect: number;
  quizTotal: number;
  bossDefeated: boolean;
}
