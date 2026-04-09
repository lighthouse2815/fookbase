export type GamePhase =
  | 'intro'
  | 'playing'
  | 'lore'
  | 'bossIntro'
  | 'bossFight'
  | 'falseVictory'
  | 'ending'
  | 'gameOver'
  | 'paused';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Platform extends Rect {
  id: string;
  kind: 'stone' | 'bridge' | 'flesh';
  crumble?: boolean;
  collapsed?: boolean;
  collapseTimer?: number;
  collapseDelay?: number;
  respawnTimer?: number;
}

export type TrapType =
  | 'spikes'
  | 'saw'
  | 'flameJet'
  | 'fallingSpikes'
  | 'chainSweep'
  | 'acidPool'
  | 'crusher'
  | 'explosiveVial';

export interface Trap extends Rect {
  id: string;
  type: TrapType;
  baseX: number;
  baseY: number;
  damage: number;
  timer: number;
  interval: number;
  duration: number;
  active: boolean;
  moveRange?: number;
  moveSpeed?: number;
  maxHeight?: number;
  triggered?: boolean;
  exploded?: boolean;
  phaseOnly?: 1 | 2;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
  radius: number;
  kind: 'bloodGold' | 'soul' | 'eye';
  collected: boolean;
  bobOffset: number;
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  reached: boolean;
  label: string;
}

export interface Decoration extends Rect {
  id: string;
  type:
    | 'grave'
    | 'gate'
    | 'mistTree'
    | 'hangedKnight'
    | 'lantern'
    | 'altar'
    | 'vialRack'
    | 'scribble'
    | 'pillar'
    | 'duCorpse'
    | 'fleshRoot'
    | 'speakerRune';
  text?: string;
}

export type ProjectileType = 'syringe' | 'vial' | 'shock' | 'flesh' | 'shockwave';

export interface Projectile extends Rect {
  id: string;
  type: ProjectileType;
  vx: number;
  vy: number;
  gravity: number;
  damage: number;
  ttl: number;
  rotation: number;
}

export interface Player extends Rect {
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  direction: -1 | 1;
  onGround: boolean;
  coyoteTimer: number;
  jumpBuffer: number;
  extraJumpsRemaining: number;
  canDash: boolean;
  dashTimer: number;
  dashCooldown: number;
  attackTimer: number;
  attackCooldown: number;
  attackConnected: boolean;
  invulnTimer: number;
}

export type BossAction =
  | 'idle'
  | 'syringeVolley'
  | 'corpseHands'
  | 'scalpelRush'
  | 'vialArc'
  | 'transform'
  | 'bloodSlam'
  | 'storm'
  | 'fleshSweep'
  | 'deathPose';

export interface Boss extends Rect {
  hp: number;
  maxHp: number;
  phase: 1 | 2;
  state: BossAction;
  stateTimer: number;
  actionStep: number;
  attackIndex: number;
  cooldown: number;
  vx: number;
  vy: number;
  facing: -1 | 1;
  invulnTimer: number;
  visible: boolean;
  alive: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: 'blood' | 'ash' | 'soul' | 'spark' | 'mist';
}

export interface DialogueLine {
  speaker: string;
  text: string;
  accent: string;
}

export interface DialogueState {
  lines: DialogueLine[];
  index: number;
  hint: string;
}

export interface CameraState {
  x: number;
  y: number;
  shakeX: number;
  shakeY: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  attack: boolean;
  confirm: boolean;
  pause: boolean;
  restart: boolean;
}

export interface TransientBanner {
  text: string;
  timer: number;
  tone: 'warning' | 'checkpoint' | 'lore' | 'victory';
}

export interface RenderState {
  phase: GamePhase;
  pausedPhase: GamePhase | null;
  worldTime: number;
  player: Player;
  boss: Boss;
  platforms: Platform[];
  traps: Trap[];
  coins: Coin[];
  projectiles: Projectile[];
  decorations: Decoration[];
  checkpoints: Checkpoint[];
  particles: Particle[];
  camera: CameraState;
  dialogue: DialogueState | null;
  totalCoins: number;
  collectedCoins: number;
  bossTriggered: boolean;
  bossArenaBounds: { start: number; end: number };
  activeCheckpointLabel: string;
  loreUnlocked: boolean;
  endingResolved: boolean;
  falseVictoryTimer: number;
  banner: TransientBanner | null;
  objectiveText: string;
  lowHealthEffect: number;
  ambientFlash: number;
}
