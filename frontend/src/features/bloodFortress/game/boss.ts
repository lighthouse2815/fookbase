import { BOSS_ARENA_END, BOSS_ARENA_START, BOSS_MAX_HP, clamp, createId } from './constants';
import type { Boss, Player, Projectile, Rect } from './types';

const createProjectile = (
  type: Projectile['type'],
  x: number,
  y: number,
  vx: number,
  vy: number,
  damage: number,
  ttl: number,
  gravity = 0,
): Projectile => ({
  id: createId('projectile'),
  type,
  x,
  y,
  width: type === 'shockwave' ? 54 : type === 'flesh' ? 26 : type === 'shock' ? 14 : 18,
  height: type === 'shockwave' ? 20 : type === 'vial' ? 24 : type === 'shock' ? 120 : 18,
  vx,
  vy,
  gravity,
  damage,
  ttl,
  rotation: 0,
});

export const createBoss = (): Boss => ({
  x: 6190,
  y: 434,
  width: 86,
  height: 176,
  hp: BOSS_MAX_HP,
  maxHp: BOSS_MAX_HP,
  phase: 1,
  state: 'idle',
  stateTimer: 0,
  actionStep: 0,
  attackIndex: 0,
  cooldown: 1.4,
  vx: 0,
  vy: 0,
  facing: -1,
  invulnTimer: 0,
  visible: false,
  alive: true,
});

const aimAtPlayer = (boss: Boss, player: Player, speed: number) => {
  const dx = player.x + player.width / 2 - (boss.x + boss.width / 2);
  const dy = player.y + player.height / 2 - (boss.y + 46);
  const distance = Math.max(1, Math.hypot(dx, dy));
  return {
    vx: (dx / distance) * speed,
    vy: (dy / distance) * speed,
  };
};

const startAttack = (boss: Boss, state: Boss['state']) => {
  boss.state = state;
  boss.stateTimer = 0;
  boss.actionStep = 0;
  boss.vx = 0;
};

const nextPhaseOneAttack = (boss: Boss) => {
  const sequence: Boss['state'][] = ['syringeVolley', 'corpseHands', 'scalpelRush', 'vialArc'];
  const nextState = sequence[boss.attackIndex % sequence.length];
  boss.attackIndex += 1;
  startAttack(boss, nextState);
};

const nextPhaseTwoAttack = (boss: Boss) => {
  const sequence: Boss['state'][] = ['bloodSlam', 'storm', 'fleshSweep', 'vialArc'];
  const nextState = sequence[boss.attackIndex % sequence.length];
  boss.attackIndex += 1;
  startAttack(boss, nextState);
};

const moveBossTowardPlayer = (boss: Boss, player: Player, dt: number) => {
  const targetX = clamp(
    player.x + player.width / 2 - boss.width / 2,
    BOSS_ARENA_START + 120,
    BOSS_ARENA_END - 200,
  );
  const delta = targetX - boss.x;
  boss.vx = delta * 1.9;
  boss.x += boss.vx * dt;
  boss.x = clamp(boss.x, BOSS_ARENA_START + 82, BOSS_ARENA_END - boss.width - 52);
  boss.facing = player.x + player.width / 2 < boss.x + boss.width / 2 ? -1 : 1;
};

const updatePhaseOne = (boss: Boss, player: Player, dt: number, projectiles: Projectile[]) => {
  switch (boss.state) {
    case 'idle': {
      moveBossTowardPlayer(boss, player, dt);
      boss.cooldown -= dt;
      if (boss.cooldown <= 0) {
        nextPhaseOneAttack(boss);
      }
      break;
    }
    case 'syringeVolley': {
      moveBossTowardPlayer(boss, player, dt * 0.5);
      if (boss.actionStep < 4 && boss.stateTimer >= 0.28 * boss.actionStep) {
        const aim = aimAtPlayer(boss, player, 360);
        const spread = (boss.actionStep - 1.5) * 38;
        projectiles.push(
          createProjectile('syringe', boss.x + 24, boss.y + 46, aim.vx + spread, aim.vy - 10, 16, 3.1),
        );
        boss.actionStep += 1;
      }
      if (boss.stateTimer >= 1.4) {
        boss.state = 'idle';
        boss.cooldown = 0.72;
      }
      break;
    }
    case 'corpseHands': {
      if (boss.actionStep < 3 && boss.stateTimer >= 0.45 * boss.actionStep) {
        const spawnX = clamp(player.x + boss.actionStep * 60 - 60, BOSS_ARENA_START + 70, BOSS_ARENA_END - 90);
        projectiles.push(createProjectile('flesh', spawnX, 640, 0, -220, 20, 1.4, 380));
        boss.actionStep += 1;
      }
      if (boss.stateTimer >= 1.55) {
        boss.state = 'idle';
        boss.cooldown = 0.8;
      }
      break;
    }
    case 'scalpelRush': {
      if (boss.actionStep === 0) {
        boss.vx = boss.facing * 560;
        boss.actionStep = 1;
      }
      boss.x += boss.vx * dt;
      if (boss.x <= BOSS_ARENA_START + 80 || boss.x >= BOSS_ARENA_END - boss.width - 52) {
        boss.vx *= -1;
        boss.facing = boss.vx < 0 ? -1 : 1;
      }
      if (boss.stateTimer >= 0.92) {
        boss.state = 'idle';
        boss.cooldown = 0.78;
        boss.vx = 0;
      }
      break;
    }
    case 'vialArc': {
      if (boss.actionStep < 3 && boss.stateTimer >= 0.26 * boss.actionStep) {
        const speed = 160 + boss.actionStep * 38;
        projectiles.push(
          createProjectile(
            'vial',
            boss.x + 30,
            boss.y + 36,
            -boss.facing * speed,
            -340 - boss.actionStep * 35,
            18,
            3.5,
            700,
          ),
        );
        boss.actionStep += 1;
      }
      if (boss.stateTimer >= 1.2) {
        boss.state = 'idle';
        boss.cooldown = 0.82;
      }
      break;
    }
    default:
      break;
  }
};

const updatePhaseTwo = (boss: Boss, player: Player, dt: number, projectiles: Projectile[]) => {
  switch (boss.state) {
    case 'idle': {
      moveBossTowardPlayer(boss, player, dt * 0.65);
      boss.cooldown -= dt;
      if (boss.cooldown <= 0) {
        nextPhaseTwoAttack(boss);
      }
      break;
    }
    case 'bloodSlam': {
      if (boss.actionStep === 0) {
        boss.vy = -420;
        boss.actionStep = 1;
      }
      boss.vy += 1240 * dt;
      boss.y += boss.vy * dt;
      if (boss.y >= 434) {
        boss.y = 434;
        boss.vy = 0;
        if (boss.actionStep === 1) {
          projectiles.push(createProjectile('shockwave', boss.x - 12, 588, -260, 0, 20, 1.8));
          projectiles.push(createProjectile('shockwave', boss.x + 54, 588, 260, 0, 20, 1.8));
          boss.actionStep = 2;
        }
      }
      if (boss.stateTimer >= 1.3) {
        boss.state = 'idle';
        boss.cooldown = 0.56;
      }
      break;
    }
    case 'storm': {
      if (boss.actionStep < 5 && boss.stateTimer >= 0.24 * boss.actionStep) {
        const offset = 120 + boss.actionStep * 160;
        const spawnX = BOSS_ARENA_START + offset;
        projectiles.push(createProjectile('shock', spawnX, 90, 0, 360, 19, 2.1));
        boss.actionStep += 1;
      }
      if (boss.stateTimer >= 1.55) {
        boss.state = 'idle';
        boss.cooldown = 0.62;
      }
      break;
    }
    case 'fleshSweep': {
      if (boss.actionStep === 0) {
        boss.vx = boss.facing * 420;
        boss.actionStep = 1;
      }
      boss.x += boss.vx * dt;
      if (boss.stateTimer >= 0.24 && boss.actionStep === 1) {
        projectiles.push(createProjectile('flesh', boss.x + 28, boss.y + 84, boss.facing * 260, -40, 22, 1.15));
        boss.actionStep = 2;
      }
      if (boss.stateTimer >= 0.94) {
        boss.state = 'idle';
        boss.cooldown = 0.58;
        boss.vx = 0;
      }
      break;
    }
    case 'vialArc': {
      if (boss.actionStep < 4 && boss.stateTimer >= 0.18 * boss.actionStep) {
        const direction = boss.actionStep % 2 === 0 ? -1 : 1;
        projectiles.push(
          createProjectile('vial', boss.x + 40, boss.y + 34, direction * (180 + boss.actionStep * 34), -360, 19, 3.1, 760),
        );
        boss.actionStep += 1;
      }
      if (boss.stateTimer >= 1.1) {
        boss.state = 'idle';
        boss.cooldown = 0.58;
      }
      break;
    }
    default:
      break;
  }
};

export const updateBoss = (boss: Boss, player: Player, dt: number) => {
  const spawnedProjectiles: Projectile[] = [];
  let triggeredPhaseChange = false;

  if (!boss.visible || !boss.alive) {
    return { spawnedProjectiles, triggeredPhaseChange };
  }

  boss.stateTimer += dt;
  boss.invulnTimer = Math.max(0, boss.invulnTimer - dt);

  if (boss.phase === 1 && boss.hp <= boss.maxHp * 0.42 && boss.state !== 'transform') {
    boss.phase = 2;
    boss.state = 'transform';
    boss.stateTimer = 0;
    boss.actionStep = 0;
    boss.invulnTimer = 1.45;
    triggeredPhaseChange = true;
  }

  if (boss.phase === 2 && boss.state === 'transform') {
    boss.y = 414 + Math.sin(boss.stateTimer * 12) * 10;
    if (boss.stateTimer >= 1.45) {
      boss.y = 414;
      boss.state = 'idle';
      boss.cooldown = 0.7;
      boss.stateTimer = 0;
    }
    return { spawnedProjectiles, triggeredPhaseChange };
  }

  if (boss.phase === 1) {
    updatePhaseOne(boss, player, dt, spawnedProjectiles);
  } else {
    updatePhaseTwo(boss, player, dt, spawnedProjectiles);
  }

  return { spawnedProjectiles, triggeredPhaseChange };
};

export const getBossContactRect = (boss: Boss): Rect => {
  if (boss.state === 'scalpelRush') {
    return { x: boss.x - 18, y: boss.y + 52, width: boss.width + 36, height: 74 };
  }

  if (boss.phase === 2 && boss.state === 'fleshSweep') {
    return { x: boss.x - 26, y: boss.y + 34, width: boss.width + 52, height: 130 };
  }

  return { x: boss.x + 6, y: boss.y + 18, width: boss.width - 12, height: boss.height - 18 };
};

export const damageBoss = (boss: Boss, amount: number) => {
  if (boss.invulnTimer > 0 || !boss.visible || !boss.alive || boss.state === 'transform') {
    return false;
  }

  boss.hp = Math.max(0, boss.hp - amount);
  boss.invulnTimer = 0.14;

  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.alive = false;
    boss.state = 'deathPose';
    boss.stateTimer = 0;
    boss.vx = 0;
    boss.vy = 0;
  }

  return true;
};
