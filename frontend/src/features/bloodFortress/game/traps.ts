import { createId, intersects } from './constants';
import type { Particle, Player, Trap } from './types';

export const updateTraps = (traps: Trap[], dt: number, bossPhase: 1 | 2) => {
  traps.forEach((trap) => {
    trap.timer += dt;

    if (trap.phaseOnly && trap.phaseOnly !== bossPhase) {
      trap.active = false;
      if (trap.type === 'flameJet') {
        trap.height = 0;
      }
      return;
    }

    switch (trap.type) {
      case 'saw':
      case 'chainSweep': {
        const range = trap.moveRange ?? 0;
        const speed = trap.moveSpeed ?? 1;
        trap.x = trap.baseX + Math.sin(trap.timer * speed) * range;
        trap.y = trap.baseY + (trap.type === 'saw' ? Math.cos(trap.timer * speed * 0.65) * 14 : 0);
        trap.active = true;
        break;
      }
      case 'spikes': {
        const cycle = trap.interval + trap.duration;
        const cycleTime = cycle > 0 ? trap.timer % cycle : trap.timer;
        trap.active = cycleTime >= trap.interval;
        const targetHeight = trap.active ? trap.maxHeight ?? trap.height : 14;
        trap.height += (targetHeight - trap.height) * 0.32;
        trap.y = trap.baseY + (trap.maxHeight ?? targetHeight) - trap.height;
        break;
      }
      case 'flameJet': {
        const cycle = trap.interval + trap.duration;
        const cycleTime = cycle > 0 ? trap.timer % cycle : trap.timer;
        trap.active = cycleTime >= trap.interval;
        trap.height = trap.active ? 124 : 26;
        trap.y = trap.active ? trap.baseY : trap.baseY + 98;
        break;
      }
      case 'fallingSpikes': {
        const cycle = trap.interval + trap.duration;
        const cycleTime = cycle > 0 ? trap.timer % cycle : trap.timer;
        const dropDistance = trap.moveRange ?? 320;
        if (cycleTime < trap.interval) {
          trap.active = false;
          trap.y = trap.baseY;
        } else {
          trap.active = true;
          const progress = Math.min((cycleTime - trap.interval) / trap.duration, 1);
          trap.y = trap.baseY + dropDistance * progress;
        }
        break;
      }
      case 'acidPool': {
        trap.active = true;
        break;
      }
      case 'explosiveVial': {
        if (!trap.triggered) {
          trap.active = false;
          trap.exploded = false;
          break;
        }

        if ((trap.timer % (trap.interval + trap.duration)) < trap.interval) {
          trap.active = false;
          break;
        }

        trap.active = true;
        trap.exploded = true;
        break;
      }
      case 'crusher': {
        const range = trap.moveRange ?? 220;
        const speed = trap.moveSpeed ?? 2;
        const depth = (Math.sin(trap.timer * speed) + 1) / 2;
        trap.y = trap.baseY + range * depth;
        trap.active = true;
        break;
      }
    }
  });
};

export const trapHitsPlayer = (trap: Trap, player: Player) => {
  if (!trap.active) {
    return false;
  }

  if (trap.type === 'acidPool') {
    return intersects(
      { x: player.x + 6, y: player.y + player.height - 10, width: player.width - 12, height: 12 },
      trap,
    );
  }

  return intersects(player, trap);
};

export const armExplosiveVials = (traps: Trap[], player: Player) => {
  traps.forEach((trap) => {
    if (trap.type !== 'explosiveVial' || trap.triggered) {
      return;
    }

    const dx = player.x + player.width / 2 - (trap.x + trap.width / 2);
    const dy = player.y + player.height / 2 - (trap.y + trap.height / 2);
    if (dx * dx + dy * dy > 78 * 78) {
      return;
    }

    trap.triggered = true;
    trap.timer = 0;
  });
};

export const releaseTrapParticles = (trap: Trap, particles: Particle[]) => {
  if (!(trap.type === 'explosiveVial' && trap.active && trap.exploded)) {
    return;
  }

  if (trap.timer > trap.interval + 0.02) {
    return;
  }

  for (let index = 0; index < 12; index += 1) {
    const angle = (Math.PI * 2 * index) / 12;
    particles.push({
      id: createId('particle'),
      x: trap.x + trap.width / 2,
      y: trap.y + trap.height / 2,
      vx: Math.cos(angle) * 140,
      vy: Math.sin(angle) * 140 - 40,
      life: 0.5,
      maxLife: 0.5,
      size: 5,
      color: index % 2 === 0 ? '#ff7a52' : '#f6d866',
      kind: 'spark',
    });
  }
};
