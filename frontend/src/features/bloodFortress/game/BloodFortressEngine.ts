import {
  BOSS_ARENA_END,
  BOSS_ARENA_START,
  GAME_HEIGHT,
  GAME_WIDTH,
  WORLD_END_X,
  WORLD_FLOOR_Y,
  clamp,
  createId,
  intersects,
  lerp,
} from './constants';
import { introDialogue, duLoreDialogue, bossDialogue, endingDialogue } from './content';
import { BloodFortressAudio } from './audio';
import { createBoss, damageBoss, getBossContactRect, updateBoss } from './boss';
import { collectCoins, countCollectedCoins } from './coins';
import {
  createCheckpoints,
  createCoins,
  createDecorations,
  createPlatforms,
  createSpawnPoint,
  createTraps,
  getRespawnPosition,
} from './levelData';
import {
  createPlayer,
  damagePlayer,
  getPlayerAttackDamage,
  getPlayerAttackRect,
  respawnPlayer,
  updatePlayer,
} from './player';
import { renderBloodFortress } from './render';
import { armExplosiveVials, releaseTrapParticles, trapHitsPlayer, updateTraps } from './traps';
import type {
  CameraState,
  DialogueState,
  GamePhase,
  InputState,
  Particle,
  Projectile,
  RenderState,
  TransientBanner,
} from './types';

type LatchedInput = Omit<InputState, 'left' | 'right'>;

const EMPTY_LATCHED: LatchedInput = {
  jump: false,
  dash: false,
  attack: false,
  confirm: false,
  pause: false,
  restart: false,
};

export class BloodFortressEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly audio = new BloodFortressAudio();
  private readonly camera: CameraState = { x: 0, y: 0, shakeX: 0, shakeY: 0 };
  private readonly canvas: HTMLCanvasElement;

  private frameId = 0;
  private lastFrameTime = 0;
  private worldTime = 0;
  private phase: GamePhase = 'intro';
  private pausedPhase: GamePhase | null = null;
  private dialogue: DialogueState | null = {
    lines: introDialogue,
    index: 0,
    hint: 'Enter / E',
  };
  private dialogueReturnPhase: GamePhase = 'playing';

  private player = createPlayer(createSpawnPoint().x, createSpawnPoint().y);
  private boss = createBoss();
  private platforms = createPlatforms();
  private traps = createTraps();
  private coins = createCoins();
  private checkpoints = createCheckpoints();
  private decorations = createDecorations();
  private particles: Particle[] = [];
  private projectiles: Projectile[] = [];
  private banner: TransientBanner | null = null;

  private inputState = {
    left: false,
    right: false,
  };

  private latchedInput: LatchedInput = { ...EMPTY_LATCHED };
  private activeCheckpointIndex = 0;
  private bossTriggered = false;
  private loreUnlocked = false;
  private endingResolved = false;
  private falseVictoryTimer = 0;
  private ambientFlash = 0;
  private shakeTime = 0;
  private shakeIntensity = 0;
  private allCoinsCelebrated = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is not available.');
    }

    this.ctx = context;
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
    this.canvas.tabIndex = 0;
  }

  start() {
    this.attachListeners();
    this.frameId = window.requestAnimationFrame(this.loop);
  }

  destroy() {
    window.cancelAnimationFrame(this.frameId);
    this.detachListeners();
    this.audio.destroy();
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const prevent = () => event.preventDefault();

    switch (key) {
      case 'a':
      case 'arrowleft':
        this.inputState.left = true;
        prevent();
        break;
      case 'd':
      case 'arrowright':
        this.inputState.right = true;
        prevent();
        break;
      case ' ':
      case 'w':
      case 'arrowup':
        this.latchInput('jump', event.repeat);
        prevent();
        break;
      case 'shift':
        this.latchInput('dash', event.repeat);
        prevent();
        break;
      case 'j':
      case 'f':
        this.latchInput('attack', event.repeat);
        prevent();
        break;
      case 'enter':
      case 'e':
        this.latchInput('confirm', event.repeat);
        prevent();
        break;
      case 'escape':
      case 'p':
        this.latchInput('pause', event.repeat);
        prevent();
        break;
      case 'r':
        this.latchInput('restart', event.repeat);
        prevent();
        break;
      default:
        break;
    }

    this.audio.unlock();
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    switch (key) {
      case 'a':
      case 'arrowleft':
        this.inputState.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.inputState.right = false;
        break;
      default:
        break;
    }
  };

  private readonly handlePointerDown = () => {
    this.audio.unlock();
    this.canvas.focus();
  };

  private attachListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  private detachListeners() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
  }

  private latchInput(key: keyof LatchedInput, isRepeat: boolean) {
    if (isRepeat) {
      return;
    }

    this.latchedInput[key] = true;
  }

  private consumeInput(): InputState {
    const frameInput: InputState = {
      left: this.inputState.left,
      right: this.inputState.right,
      jump: this.latchedInput.jump,
      dash: this.latchedInput.dash,
      attack: this.latchedInput.attack,
      confirm: this.latchedInput.confirm,
      pause: this.latchedInput.pause,
      restart: this.latchedInput.restart,
    };
    this.latchedInput = { ...EMPTY_LATCHED };
    return frameInput;
  }

  private readonly loop = (timestamp: number) => {
    const dt = this.lastFrameTime === 0 ? 0 : clamp((timestamp - this.lastFrameTime) / 1000, 0, 1 / 30);
    this.lastFrameTime = timestamp;

    this.update(dt);
    renderBloodFortress(this.ctx, this.buildRenderState());

    this.frameId = window.requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.worldTime += dt;
    this.ambientFlash = Math.max(0, this.ambientFlash - dt * 0.8);

    if (this.banner) {
      this.banner.timer -= dt;
      if (this.banner.timer <= 0) {
        this.banner = null;
      }
    }

    this.updateParticles(dt);
    this.updateCameraShake(dt);

    const input = this.consumeInput();

    if (this.phase === 'paused') {
      if (input.pause) {
        this.phase = this.pausedPhase ?? 'playing';
        this.pausedPhase = null;
      }
      this.updateCamera();
      this.updateAudio();
      return;
    }

    if (input.pause && (this.phase === 'playing' || this.phase === 'bossFight')) {
      this.pausedPhase = this.phase;
      this.phase = 'paused';
      this.updateCamera();
      this.updateAudio();
      return;
    }

    if (this.phase === 'intro' || this.phase === 'lore' || this.phase === 'bossIntro') {
      if (input.confirm) {
        this.advanceDialogue();
      }
      this.updateCamera();
      this.updateAudio();
      return;
    }

    if (this.phase === 'ending') {
      if (!this.endingResolved && input.confirm) {
        this.advanceDialogue();
      } else if (this.endingResolved && (input.confirm || input.restart)) {
        this.resetGame();
      }
      this.updateCamera();
      this.updateAudio();
      return;
    }

    if (this.phase === 'gameOver') {
      if (input.confirm || input.restart) {
        this.restoreFromCheckpoint();
      }
      this.updateCamera();
      this.updateAudio();
      return;
    }

    if (this.phase === 'falseVictory') {
      this.falseVictoryTimer += dt;
      if (this.falseVictoryTimer >= 2.2) {
        this.phase = 'ending';
        this.dialogue = {
          lines: endingDialogue,
          index: 0,
          hint: 'Enter / E',
        };
        this.dialogueReturnPhase = 'ending';
      }
      this.updateCamera();
      this.updateAudio();
      return;
    }

    this.updatePlatforms(dt);
    updateTraps(this.traps, dt, this.boss.phase);
    armExplosiveVials(this.traps, this.player);
    this.traps.forEach((trap) => releaseTrapParticles(trap, this.particles));

    const canDash = this.player.canDash && this.player.dashCooldown <= 0;
    const canAttack = this.player.attackCooldown <= 0;

    updatePlayer(this.player, input, dt, this.platforms);
    this.player.x = clamp(this.player.x, -120, WORLD_END_X - this.player.width);

    if (input.dash && canDash) {
      this.audio.playDash();
    }

    if (input.attack && canAttack) {
      this.audio.playSlash();
    }

    if (this.bossTriggered) {
      this.player.x = clamp(this.player.x, BOSS_ARENA_START + 16, BOSS_ARENA_END - this.player.width - 18);
    }

    this.handleCheckpointDiscovery();
    this.handleCoins();
    this.handleLoreTrigger();
    this.handleTrapDamage();
    this.handleProjectileUpdates(dt);

    const attackRect = getPlayerAttackRect(this.player);
    if (attackRect && !this.player.attackConnected && this.boss.visible && this.boss.alive && intersects(attackRect, this.boss)) {
      if (damageBoss(this.boss, getPlayerAttackDamage())) {
        this.player.attackConnected = true;
        this.spawnParticles(this.boss.x + this.boss.width / 2, this.boss.y + 40, '#d64f5c', 10, 'blood');
        this.kickCamera(12, 0.18);
      }
    }

    if (!this.bossTriggered && this.player.x >= BOSS_ARENA_START - 110) {
      this.triggerBossIntro();
    }

    if (this.phase === 'bossFight') {
      const { spawnedProjectiles, triggeredPhaseChange } = updateBoss(this.boss, this.player, dt);
      this.projectiles.push(...spawnedProjectiles);

      if (triggeredPhaseChange) {
        this.audio.playBossRoar();
        this.kickCamera(18, 0.35);
        this.ambientFlash = 1;
        this.showBanner('Dr.Phieu xé xác mình thành giai đoạn hai.', 'warning', 2.2);
      }

      if (this.boss.visible && this.boss.alive && intersects(this.player, getBossContactRect(this.boss))) {
        this.hurtPlayer(18, this.boss.x + this.boss.width / 2);
      }

      if (!this.boss.alive) {
        this.phase = 'falseVictory';
        this.falseVictoryTimer = 0;
        this.ambientFlash = 0.9;
        this.showBanner('Ngươi nghĩ mình đã thắng.', 'victory', 2.2);
      }
    }

    if (this.player.y > GAME_HEIGHT + 160) {
      this.player.hp = 0;
    }

    if (this.player.hp <= 0) {
      this.phase = 'gameOver';
      this.showBanner('Máu của Đăng lạnh dần trên đá.', 'warning', 2);
    }

    this.updateCamera();
    this.updateAudio();
  }

  private updatePlatforms(dt: number) {
    this.platforms.forEach((platform) => {
      if (!platform.crumble) {
        return;
      }

      if (!platform.collapsed && (platform.collapseTimer ?? 0) > 0) {
        platform.collapseTimer = Math.max(0, (platform.collapseTimer ?? 0) - dt);
        if ((platform.collapseTimer ?? 0) <= 0) {
          platform.collapsed = true;
          platform.respawnTimer = 3.6;
          this.spawnParticles(platform.x + platform.width / 2, platform.y + 8, '#80635a', 12, 'ash');
        }
      }

      if (platform.collapsed) {
        platform.respawnTimer = Math.max(0, (platform.respawnTimer ?? 0) - dt);
        if ((platform.respawnTimer ?? 0) <= 0) {
          platform.collapsed = false;
        }
      }
    });
  }

  private handleCheckpointDiscovery() {
    this.checkpoints.forEach((checkpoint, index) => {
      const touchRect = {
        x: checkpoint.x - 20,
        y: checkpoint.y,
        width: checkpoint.width + 40,
        height: checkpoint.height,
      };

      if (!intersects(this.player, touchRect) || checkpoint.reached) {
        return;
      }

      checkpoint.reached = true;
      this.activeCheckpointIndex = index;
      this.audio.playCheckpoint();
      this.showBanner(`Checkpoint: ${checkpoint.label}`, 'checkpoint', 2.1);
    });
  }

  private handleCoins() {
    const gained = collectCoins(this.player, this.coins, this.worldTime, this.particles);
    if (gained > 0) {
      for (let index = 0; index < gained; index += 1) {
        this.audio.playCoin();
      }
    }

    const totalCollected = countCollectedCoins(this.coins);
    if (!this.allCoinsCelebrated && totalCollected === this.coins.length) {
      this.allCoinsCelebrated = true;
      this.showBanner('Mọi mảnh linh hồn đã trở về tay Đăng.', 'lore', 2.6);
    }
  }

  private handleLoreTrigger() {
    if (this.loreUnlocked || this.phase !== 'playing') {
      return;
    }

    if (countCollectedCoins(this.coins) < 10) {
      return;
    }

    const duCorpse = this.decorations.find((decoration) => decoration.type === 'duCorpse');
    if (!duCorpse) {
      return;
    }

    const closeEnough =
      this.player.x + this.player.width > duCorpse.x - 80 && this.player.x < duCorpse.x + duCorpse.width + 80;

    if (!closeEnough) {
      return;
    }

    this.loreUnlocked = true;
    this.phase = 'lore';
    this.dialogue = {
      lines: duLoreDialogue,
      index: 0,
      hint: 'Enter / E',
    };
    this.dialogueReturnPhase = 'playing';
    this.showBanner('Ký ức cuối của Hiệp sĩ Dư thức dậy.', 'lore', 2.4);
  }

  private handleTrapDamage() {
    this.traps.forEach((trap) => {
      if (!trapHitsPlayer(trap, this.player)) {
        return;
      }

      this.hurtPlayer(trap.damage, trap.x + trap.width / 2);
    });
  }

  private handleProjectileUpdates(dt: number) {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.ttl -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.vy += projectile.gravity * dt;
      projectile.rotation += projectile.vx * dt * 0.02;

      if (intersects(projectile, this.player)) {
        this.hurtPlayer(projectile.damage, projectile.x + projectile.width / 2);
        this.projectiles.splice(index, 1);
        continue;
      }

      const hitWorld =
        projectile.y > WORLD_FLOOR_Y + 120 ||
        projectile.x < this.camera.x - 200 ||
        projectile.x > this.camera.x + GAME_WIDTH + 220 ||
        this.platforms.some((platform) => !platform.collapsed && intersects(projectile, platform));

      if (hitWorld) {
        if (projectile.type === 'vial' || projectile.type === 'flesh' || projectile.type === 'shock') {
          this.spawnParticles(projectile.x, projectile.y, '#e97061', 8, 'spark');
        }
        this.projectiles.splice(index, 1);
        continue;
      }

      if (projectile.ttl <= 0) {
        this.projectiles.splice(index, 1);
      }
    }
  }

  private triggerBossIntro() {
    this.bossTriggered = true;
    this.boss.visible = true;
    this.phase = 'bossIntro';
    this.dialogue = {
      lines: bossDialogue,
      index: 0,
      hint: 'Enter / E',
    };
    this.dialogueReturnPhase = 'bossFight';
    this.audio.playBossRoar();
    this.kickCamera(14, 0.3);
    this.showBanner('Cánh cổng thịt khóa sau lưng Đăng.', 'warning', 2.4);
  }

  private advanceDialogue() {
    if (!this.dialogue) {
      return;
    }

    if (this.dialogue.index < this.dialogue.lines.length - 1) {
      this.dialogue.index += 1;
      return;
    }

    const leavingPhase = this.phase;
    this.dialogue = null;

    if (leavingPhase === 'ending') {
      this.endingResolved = true;
      return;
    }

    this.phase = this.dialogueReturnPhase;

    if (leavingPhase === 'intro') {
      this.showBanner('Băng qua nghĩa địa. Đừng để pháo đài học tên ngươi.', 'warning', 2.6);
    }
  }

  private restoreFromCheckpoint() {
    const checkpoint = this.checkpoints[this.activeCheckpointIndex];
    const respawn = getRespawnPosition(checkpoint);
    respawnPlayer(this.player, respawn.x, respawn.y);
    this.projectiles = [];
    this.phase = this.bossTriggered ? 'bossFight' : 'playing';
    if (this.bossTriggered && !this.boss.alive) {
      this.phase = 'playing';
      this.bossTriggered = false;
      this.boss = createBoss();
    }
  }

  private resetGame() {
    const spawn = createSpawnPoint();
    this.player = createPlayer(spawn.x, spawn.y);
    this.boss = createBoss();
    this.platforms = createPlatforms();
    this.traps = createTraps();
    this.coins = createCoins();
    this.checkpoints = createCheckpoints();
    this.decorations = createDecorations();
    this.projectiles = [];
    this.particles = [];
    this.activeCheckpointIndex = 0;
    this.bossTriggered = false;
    this.loreUnlocked = false;
    this.endingResolved = false;
    this.falseVictoryTimer = 0;
    this.ambientFlash = 0;
    this.allCoinsCelebrated = false;
    this.phase = 'intro';
    this.dialogue = {
      lines: introDialogue,
      index: 0,
      hint: 'Enter / E',
    };
    this.dialogueReturnPhase = 'playing';
    this.banner = null;
  }

  private hurtPlayer(amount: number, sourceX: number) {
    const knockbackX = this.player.x + this.player.width / 2 < sourceX ? -240 : 240;
    if (!damagePlayer(this.player, amount, knockbackX, -280)) {
      return;
    }

    this.audio.playHit();
    this.spawnParticles(this.player.x + this.player.width / 2, this.player.y + 36, '#d64556', 9, 'blood');
    this.kickCamera(10, 0.16);
  }

  private spawnParticles(
    x: number,
    y: number,
    color: string,
    count: number,
    kind: Particle['kind'],
  ) {
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.4;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        id: createId('particle'),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 80,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.45 + Math.random() * 0.35,
        size: 3 + Math.floor(Math.random() * 4),
        color,
        kind,
      });
    }
  }

  private updateParticles(dt: number) {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.kind === 'mist' ? -8 * dt : 240 * dt;
      particle.vx *= particle.kind === 'mist' ? 0.99 : 0.96;
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
      }
    }
  }

  private updateCameraShake(dt: number) {
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      this.camera.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 0.7;
      this.shakeIntensity *= 0.94;
      return;
    }

    this.camera.shakeX = 0;
    this.camera.shakeY = 0;
  }

  private kickCamera(intensity: number, duration: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  private showBanner(text: string, tone: TransientBanner['tone'], timer: number) {
    this.banner = { text, tone, timer };
  }

  private updateCamera() {
    const arenaStart = BOSS_ARENA_START - 40;
    const arenaEnd = BOSS_ARENA_END - GAME_WIDTH + 40;
    const worldMax = WORLD_END_X - GAME_WIDTH;
    const targetX = this.bossTriggered
      ? clamp(this.player.x - GAME_WIDTH * 0.36, arenaStart, arenaEnd)
      : clamp(this.player.x - GAME_WIDTH * 0.36, 0, worldMax);

    this.camera.x = lerp(this.camera.x, targetX, 0.12);
    this.camera.y = 0;
  }

  private updateAudio() {
    const lowHealthFactor = clamp(1 - this.player.hp / this.player.maxHp, 0, 1);
    const bossIntensity =
      this.phase === 'bossFight' || this.phase === 'bossIntro' || this.phase === 'falseVictory' || this.phase === 'ending'
        ? 1
        : this.bossTriggered
          ? 0.4
          : 0;
    this.audio.setBossIntensity(bossIntensity);
    this.audio.tick(lowHealthFactor);
  }

  private getObjectiveText() {
    if (this.phase === 'bossFight' || this.phase === 'bossIntro') {
      return 'Đấu trí với Dr.Phieu trong phòng thí nghiệm ngai vàng.';
    }

    if (this.phase === 'falseVictory' || this.phase === 'ending') {
      return 'Quá muộn để đổi số phận của hiệp sĩ cuối cùng.';
    }

    return this.bossTriggered
      ? 'Tiến vào lõi pháo đài đang co giật và sống sót đủ lâu.'
      : 'Băng qua nghĩa địa, nhà nguyện, hành lang tra tấn và tới ngai máu.';
  }

  private buildRenderState(): RenderState {
    return {
      phase: this.phase,
      pausedPhase: this.pausedPhase,
      worldTime: this.worldTime,
      player: this.player,
      boss: this.boss,
      platforms: this.platforms,
      traps: this.traps,
      coins: this.coins,
      projectiles: this.projectiles,
      decorations: this.decorations,
      checkpoints: this.checkpoints,
      particles: this.particles,
      camera: this.camera,
      dialogue: this.dialogue,
      totalCoins: this.coins.length,
      collectedCoins: countCollectedCoins(this.coins),
      bossTriggered: this.bossTriggered,
      bossArenaBounds: { start: BOSS_ARENA_START, end: BOSS_ARENA_END },
      activeCheckpointLabel: this.checkpoints[this.activeCheckpointIndex]?.label ?? 'Cổng gãy',
      loreUnlocked: this.loreUnlocked,
      endingResolved: this.endingResolved,
      falseVictoryTimer: this.falseVictoryTimer,
      banner: this.banner,
      objectiveText: this.getObjectiveText(),
      lowHealthEffect: clamp(1 - this.player.hp / Math.max(1, this.player.maxHp), 0, 1),
      ambientFlash: this.ambientFlash,
    };
  }
}
