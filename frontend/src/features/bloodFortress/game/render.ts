import {
  BOSS_ARENA_START,
  GAME_HEIGHT,
  GAME_WIDTH,
  WORLD_FLOOR_Y,
  clamp,
} from './constants';
import type {
  Boss,
  Checkpoint,
  Coin,
  Decoration,
  Particle,
  Platform,
  Projectile,
  RenderState,
  Trap,
} from './types';

const fillPanel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke?: string,
) => {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  if (!stroke) {
    return;
  }

  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const drawSky = (ctx: CanvasRenderingContext2D, state: RenderState) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  gradient.addColorStop(0, '#070913');
  gradient.addColorStop(0.45, '#160b13');
  gradient.addColorStop(1, '#2a1212');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const zoneMix = clamp(state.camera.x / BOSS_ARENA_START, 0, 1);
  const flashAlpha = state.ambientFlash * 0.18;

  ctx.fillStyle = `rgba(164, 20, 28, ${0.12 + zoneMix * 0.18 + flashAlpha})`;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.save();
  ctx.translate(-(state.camera.x * 0.14), 0);
  for (let index = 0; index < 8; index += 1) {
    const x = 120 + index * 260;
    const height = 220 + (index % 3) * 48;
    ctx.fillStyle = index % 2 === 0 ? '#090b11' : '#11121a';
    ctx.fillRect(x, 180 + (index % 2) * 20, 110, height);
    ctx.fillRect(x + 32, 120 + (index % 3) * 8, 34, 80);
    ctx.fillRect(x + 68, 142 + (index % 2) * 14, 20, 58);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-(state.camera.x * 0.26), 0);
  for (let index = 0; index < 14; index += 1) {
    const x = index * 170;
    const height = 120 + (index % 4) * 34;
    ctx.fillStyle = index % 2 === 0 ? '#151219' : '#1d1718';
    ctx.beginPath();
    ctx.moveTo(x, GAME_HEIGHT);
    ctx.lineTo(x + 50, GAME_HEIGHT - height);
    ctx.lineTo(x + 110, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(255, 90, 90, 0.08)';
  for (let index = 0; index < 6; index += 1) {
    const baseX = (index * 220 - state.camera.x * 0.1) % (GAME_WIDTH + 300);
    ctx.beginPath();
    ctx.arc(baseX - 60, 84 + index * 6, 130, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawGroundVeins = (ctx: CanvasRenderingContext2D, state: RenderState) => {
  ctx.save();
  ctx.translate(-state.camera.x + state.camera.shakeX, state.camera.shakeY);

  for (let index = 0; index < 30; index += 1) {
    const x = index * 240;
    const intensity = x > BOSS_ARENA_START - 400 ? 0.24 : 0.1;
    ctx.strokeStyle = `rgba(108, 10, 16, ${intensity})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 100, WORLD_FLOOR_Y + 90);
    ctx.bezierCurveTo(x + 40, WORLD_FLOOR_Y + 60, x + 90, WORLD_FLOOR_Y + 130, x + 210, WORLD_FLOOR_Y + 110);
    ctx.stroke();
  }

  ctx.restore();
};

const drawPlatform = (ctx: CanvasRenderingContext2D, platform: Platform) => {
  if (platform.collapsed) {
    return;
  }

  if (platform.kind === 'stone') {
    fillPanel(ctx, platform.x, platform.y, platform.width, platform.height, '#271f22', '#504043');
    ctx.fillStyle = '#45363a';
    for (let x = platform.x + 12; x < platform.x + platform.width - 8; x += 32) {
      ctx.fillRect(x, platform.y + 10, 18, 4);
      ctx.fillRect(x - 4, platform.y + 36, 24, 4);
    }
    return;
  }

  if (platform.kind === 'bridge') {
    fillPanel(ctx, platform.x, platform.y, platform.width, platform.height, '#563a27', '#7c5f48');
    ctx.fillStyle = '#836346';
    for (let x = platform.x + 8; x < platform.x + platform.width - 8; x += 18) {
      ctx.fillRect(x, platform.y + 4, 10, platform.height - 8);
    }
    return;
  }

  fillPanel(ctx, platform.x, platform.y, platform.width, platform.height, '#4d1820', '#8b3035');
  ctx.strokeStyle = 'rgba(214, 92, 86, 0.35)';
  ctx.lineWidth = 2;
  for (let y = platform.y + 10; y < platform.y + platform.height - 10; y += 18) {
    ctx.beginPath();
    ctx.moveTo(platform.x + 8, y);
    ctx.bezierCurveTo(platform.x + 46, y - 6, platform.x + platform.width - 42, y + 10, platform.x + platform.width - 8, y);
    ctx.stroke();
  }
};

const drawTrap = (ctx: CanvasRenderingContext2D, trap: Trap) => {
  switch (trap.type) {
    case 'spikes': {
      ctx.fillStyle = trap.active ? '#e6d9d1' : '#8e8784';
      const teeth = Math.max(2, Math.floor(trap.width / 14));
      for (let index = 0; index < teeth; index += 1) {
        const toothWidth = trap.width / teeth;
        const x = trap.x + index * toothWidth;
        ctx.beginPath();
        ctx.moveTo(x, trap.y + trap.height);
        ctx.lineTo(x + toothWidth / 2, trap.y);
        ctx.lineTo(x + toothWidth, trap.y + trap.height);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'saw': {
      ctx.save();
      ctx.translate(trap.x + trap.width / 2, trap.y + trap.height / 2);
      ctx.rotate(trap.timer * 8);
      ctx.fillStyle = '#b7afb1';
      for (let index = 0; index < 10; index += 1) {
        ctx.rotate(Math.PI / 5);
        ctx.beginPath();
        ctx.moveTo(0, -trap.width / 2 - 6);
        ctx.lineTo(-5, -trap.width / 2 + 2);
        ctx.lineTo(5, -trap.width / 2 + 2);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#887c7f';
      ctx.beginPath();
      ctx.arc(0, 0, trap.width / 2 - 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'flameJet': {
      ctx.fillStyle = '#31262a';
      ctx.fillRect(trap.x + 10, trap.baseY + 90, trap.width - 20, 24);
      if (trap.active) {
        const flameGradient = ctx.createLinearGradient(0, trap.y, 0, trap.y + trap.height);
        flameGradient.addColorStop(0, 'rgba(255, 233, 168, 0.9)');
        flameGradient.addColorStop(0.45, 'rgba(255, 120, 38, 0.85)');
        flameGradient.addColorStop(1, 'rgba(167, 12, 12, 0.1)');
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.moveTo(trap.x + trap.width / 2, trap.y);
        ctx.bezierCurveTo(trap.x - 18, trap.y + 34, trap.x + 8, trap.y + trap.height, trap.x + trap.width / 2, trap.y + trap.height);
        ctx.bezierCurveTo(trap.x + trap.width - 8, trap.y + trap.height, trap.x + trap.width + 18, trap.y + 34, trap.x + trap.width / 2, trap.y);
        ctx.fill();
      }
      break;
    }
    case 'fallingSpikes': {
      ctx.fillStyle = trap.active ? '#d8d2d4' : 'rgba(216, 210, 212, 0.35)';
      ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
      ctx.fillStyle = '#32272a';
      for (let x = trap.x + 6; x < trap.x + trap.width - 4; x += 14) {
        ctx.beginPath();
        ctx.moveTo(x, trap.y + trap.height);
        ctx.lineTo(x + 6, trap.y + trap.height + 14);
        ctx.lineTo(x + 12, trap.y + trap.height);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case 'chainSweep': {
      ctx.strokeStyle = '#6a5a5f';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(trap.x - 70, trap.y + 9);
      ctx.lineTo(trap.x + trap.width, trap.y + 9);
      ctx.stroke();
      ctx.fillStyle = '#b8aaaf';
      ctx.beginPath();
      ctx.arc(trap.x + trap.width, trap.y + 9, 22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'acidPool': {
      const gradient = ctx.createLinearGradient(0, trap.y, 0, trap.y + trap.height);
      gradient.addColorStop(0, 'rgba(126, 255, 113, 0.65)');
      gradient.addColorStop(1, 'rgba(12, 58, 16, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
      ctx.fillStyle = 'rgba(226, 255, 180, 0.25)';
      for (let index = 0; index < 6; index += 1) {
        ctx.beginPath();
        ctx.arc(trap.x + 18 + index * 24, trap.y + 10 + Math.sin(trap.timer * 3 + index) * 6, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'crusher': {
      fillPanel(ctx, trap.x, trap.y, trap.width, trap.height, '#6b5458', '#af9298');
      ctx.fillStyle = '#2f2428';
      for (let x = trap.x + 12; x < trap.x + trap.width - 8; x += 24) {
        ctx.fillRect(x, trap.y + trap.height, 8, 28);
      }
      break;
    }
    case 'explosiveVial': {
      ctx.fillStyle = trap.active ? '#ff9f59' : '#6d5a5f';
      ctx.fillRect(trap.x + 8, trap.y + 4, trap.width - 16, trap.height - 8);
      ctx.fillStyle = trap.active ? '#ffd18f' : '#a89a9d';
      ctx.fillRect(trap.x + 11, trap.y - 5, trap.width - 22, 10);
      if (trap.triggered && !trap.active) {
        ctx.strokeStyle = 'rgba(255, 195, 112, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(trap.x + trap.width / 2, trap.y + trap.height / 2, 24, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
  }
};

const drawCoin = (ctx: CanvasRenderingContext2D, coin: Coin, worldTime: number) => {
  if (coin.collected) {
    return;
  }

  const y = coin.y + Math.sin(worldTime * 2.6 + coin.bobOffset) * 6;
  ctx.save();
  ctx.translate(coin.x, y);
  ctx.fillStyle =
    coin.kind === 'bloodGold' ? '#d79b4b' : coin.kind === 'eye' ? '#dfe8a6' : '#8de5ff';
  ctx.beginPath();
  ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
  ctx.fill();
  if (coin.kind === 'eye') {
    ctx.fillStyle = '#2f0707';
    ctx.beginPath();
    ctx.arc(0, 0, coin.radius / 2.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(-coin.radius / 2, -coin.radius / 2, coin.radius, 4);
  }
  ctx.restore();
};

const drawCheckpoint = (ctx: CanvasRenderingContext2D, checkpoint: Checkpoint, worldTime: number) => {
  ctx.fillStyle = '#51474a';
  ctx.fillRect(checkpoint.x + checkpoint.width / 2 - 3, checkpoint.y, 6, checkpoint.height);
  ctx.fillStyle = checkpoint.reached ? '#ecb97b' : '#4e2d33';
  ctx.beginPath();
  ctx.moveTo(checkpoint.x + checkpoint.width / 2 + 3, checkpoint.y + 10);
  ctx.lineTo(checkpoint.x + checkpoint.width / 2 + 36, checkpoint.y + 22);
  ctx.lineTo(checkpoint.x + checkpoint.width / 2 + 3, checkpoint.y + 38);
  ctx.closePath();
  ctx.fill();

  if (checkpoint.reached) {
    ctx.fillStyle = `rgba(255, 218, 170, ${0.25 + Math.sin(worldTime * 2) * 0.08})`;
    ctx.beginPath();
    ctx.arc(checkpoint.x + checkpoint.width / 2 + 20, checkpoint.y + 24, 18, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawDecoration = (ctx: CanvasRenderingContext2D, decoration: Decoration, worldTime: number) => {
  switch (decoration.type) {
    case 'gate': {
      fillPanel(ctx, decoration.x, decoration.y, decoration.width, decoration.height, '#17151b', '#433036');
      ctx.fillStyle = '#0c0a10';
      ctx.fillRect(decoration.x + 56, decoration.y + 30, 128, decoration.height - 30);
      ctx.strokeStyle = '#654046';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(decoration.x + decoration.width / 2, decoration.y + 46, 62, Math.PI, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'grave': {
      fillPanel(ctx, decoration.x + 8, decoration.y + 12, decoration.width - 16, decoration.height - 12, '#31282c', '#5c4a50');
      ctx.fillRect(decoration.x + decoration.width / 2 - 5, decoration.y - 8, 10, 26);
      ctx.fillRect(decoration.x + decoration.width / 2 - 16, decoration.y + 2, 32, 8);
      break;
    }
    case 'mistTree': {
      ctx.strokeStyle = '#1a1418';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(decoration.x + decoration.width / 2, decoration.y + decoration.height);
      ctx.lineTo(decoration.x + decoration.width / 2 - 18, decoration.y + 60);
      ctx.stroke();
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(decoration.x + decoration.width / 2 - 16, decoration.y + 100);
      ctx.lineTo(decoration.x + 18, decoration.y + 38);
      ctx.moveTo(decoration.x + decoration.width / 2 - 10, decoration.y + 132);
      ctx.lineTo(decoration.x + decoration.width - 12, decoration.y + 54);
      ctx.stroke();
      break;
    }
    case 'hangedKnight': {
      ctx.strokeStyle = '#67565a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(decoration.x + decoration.width / 2, decoration.y);
      ctx.lineTo(decoration.x + decoration.width / 2, decoration.y + 70);
      ctx.stroke();
      ctx.fillStyle = '#57484b';
      ctx.fillRect(decoration.x + 22, decoration.y + 70, 28, 60);
      ctx.fillRect(decoration.x + 26, decoration.y + 128, 8, 42);
      ctx.fillRect(decoration.x + 40, decoration.y + 128, 8, 42);
      break;
    }
    case 'lantern': {
      ctx.strokeStyle = '#645253';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(decoration.x + decoration.width / 2, decoration.y);
      ctx.lineTo(decoration.x + decoration.width / 2, decoration.y + 20);
      ctx.stroke();
      ctx.fillStyle = '#41272b';
      ctx.fillRect(decoration.x + 4, decoration.y + 18, decoration.width - 8, 26);
      ctx.fillStyle = `rgba(255, 177, 99, ${0.45 + Math.sin(worldTime * 4) * 0.1})`;
      ctx.fillRect(decoration.x + 8, decoration.y + 24, decoration.width - 16, 14);
      break;
    }
    case 'altar': {
      fillPanel(ctx, decoration.x, decoration.y + 18, decoration.width, decoration.height - 18, '#2f2025', '#654049');
      ctx.fillStyle = '#8a6971';
      ctx.fillRect(decoration.x + 8, decoration.y + 6, 12, 18);
      ctx.fillRect(decoration.x + decoration.width - 20, decoration.y + 6, 12, 18);
      ctx.fillStyle = 'rgba(255, 202, 148, 0.85)';
      ctx.fillRect(decoration.x + 10, decoration.y, 8, 10);
      ctx.fillRect(decoration.x + decoration.width - 18, decoration.y, 8, 10);
      break;
    }
    case 'duCorpse': {
      ctx.fillStyle = '#56494d';
      ctx.fillRect(decoration.x + 18, decoration.y + 22, 42, 18);
      ctx.fillRect(decoration.x + 10, decoration.y + 34, 28, 14);
      ctx.fillRect(decoration.x + 54, decoration.y + 18, 14, 36);
      ctx.strokeStyle = '#8c7073';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(decoration.x + 74, decoration.y + 8);
      ctx.lineTo(decoration.x + 90, decoration.y + 64);
      ctx.stroke();
      ctx.fillStyle = '#922937';
      ctx.fillRect(decoration.x + 36, decoration.y + 40, 18, 6);
      break;
    }
    case 'scribble': {
      ctx.fillStyle = '#22171b';
      ctx.fillRect(decoration.x, decoration.y, decoration.width, decoration.height);
      ctx.fillStyle = '#a73c46';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText(decoration.text ?? '', decoration.x + 8, decoration.y + 30);
      break;
    }
    case 'vialRack': {
      fillPanel(ctx, decoration.x, decoration.y, decoration.width, decoration.height, '#292026', '#58464b');
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const x = decoration.x + 12 + column * 24;
          const y = decoration.y + 14 + row * 24;
          ctx.fillStyle = row % 2 === 0 ? '#9fc7d0' : '#d6766a';
          ctx.fillRect(x, y, 10, 14);
        }
      }
      break;
    }
    case 'pillar': {
      fillPanel(ctx, decoration.x + 16, decoration.y, decoration.width - 32, decoration.height, '#21181d', '#4c3a41');
      ctx.fillRect(decoration.x, decoration.y + decoration.height - 22, decoration.width, 22);
      break;
    }
    case 'speakerRune': {
      fillPanel(ctx, decoration.x + 12, decoration.y + 12, decoration.width - 24, decoration.height - 12, '#2b1a1f', '#6d4249');
      ctx.strokeStyle = `rgba(255, 110, 110, ${0.28 + Math.sin(worldTime * 5) * 0.12})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(decoration.x + decoration.width / 2, decoration.y + 44, 18, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'fleshRoot': {
      ctx.fillStyle = '#4e1720';
      for (let index = 0; index < 5; index += 1) {
        ctx.beginPath();
        ctx.moveTo(decoration.x + index * 26, decoration.y + decoration.height);
        ctx.bezierCurveTo(
          decoration.x + 20 + index * 26,
          decoration.y + decoration.height - 50,
          decoration.x + 10 + index * 22,
          decoration.y + 80,
          decoration.x + 40 + index * 28,
          decoration.y,
        );
        ctx.lineWidth = 16 - index;
        ctx.strokeStyle = index % 2 === 0 ? '#66212c' : '#7c2c37';
        ctx.stroke();
      }
      break;
    }
  }
};

const drawProjectile = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  ctx.save();
  ctx.translate(projectile.x + projectile.width / 2, projectile.y + projectile.height / 2);
  ctx.rotate(projectile.rotation);

  switch (projectile.type) {
    case 'syringe':
      ctx.fillStyle = '#d5dbe4';
      ctx.fillRect(-9, -3, 18, 6);
      ctx.fillStyle = '#8ce2ff';
      ctx.fillRect(-3, -3, 6, 6);
      break;
    case 'vial':
      ctx.fillStyle = '#e69f73';
      ctx.fillRect(-8, -12, 16, 24);
      ctx.fillStyle = '#ff735d';
      ctx.fillRect(-6, -4, 12, 10);
      break;
    case 'shock':
      ctx.fillStyle = '#f7e795';
      ctx.fillRect(-6, -projectile.height / 2, 12, projectile.height);
      ctx.fillStyle = 'rgba(255, 255, 215, 0.5)';
      ctx.fillRect(-12, -projectile.height / 2, 24, projectile.height);
      break;
    case 'flesh':
      ctx.fillStyle = '#b14657';
      ctx.fillRect(-projectile.width / 2, -projectile.height / 2, projectile.width, projectile.height);
      break;
    case 'shockwave':
      ctx.fillStyle = '#e5d2af';
      ctx.fillRect(-projectile.width / 2, -projectile.height / 2, projectile.width, projectile.height);
      break;
  }

  ctx.restore();
};

const drawPlayer = (ctx: CanvasRenderingContext2D, state: RenderState) => {
  const { player } = state;

  if (player.invulnTimer > 0 && Math.floor(player.invulnTimer * 18) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.direction < 0) {
    ctx.translate(player.width, 0);
    ctx.scale(-1, 1);
  }

  if (player.dashTimer > 0) {
    ctx.fillStyle = 'rgba(204, 94, 99, 0.25)';
    ctx.fillRect(-22, 8, player.width + 20, player.height - 12);
  }

  ctx.fillStyle = '#d6c7ab';
  ctx.fillRect(12, 4, 18, 18);
  ctx.fillStyle = '#3f3a42';
  ctx.fillRect(10, 2, 22, 12);
  ctx.fillStyle = '#6d5560';
  ctx.fillRect(8, 22, 28, 28);
  ctx.fillStyle = '#5f1320';
  ctx.fillRect(4, 24, 36, 44);
  ctx.fillStyle = '#36272c';
  ctx.fillRect(10, 50, 10, 26);
  ctx.fillRect(24, 50, 10, 26);
  ctx.fillStyle = '#a7a3a6';
  ctx.fillRect(14, 30, 16, 8);

  if (player.attackTimer > 0.04) {
    ctx.fillStyle = '#efdfc4';
    ctx.fillRect(30, 26, 38, 6);
    ctx.fillStyle = '#8a7073';
    ctx.fillRect(24, 28, 10, 4);
  }

  ctx.restore();
};

const drawBoss = (ctx: CanvasRenderingContext2D, boss: Boss, worldTime: number) => {
  if (!boss.visible) {
    return;
  }

  ctx.save();
  ctx.translate(boss.x, boss.y);
  if (boss.facing < 0) {
    ctx.translate(boss.width, 0);
    ctx.scale(-1, 1);
  }

  if (boss.phase === 1) {
    ctx.fillStyle = '#e5ddcc';
    ctx.fillRect(26, 10, 22, 22);
    ctx.fillStyle = '#7b1019';
    ctx.fillRect(16, 28, 50, 120);
    ctx.fillStyle = '#3a0b10';
    ctx.fillRect(8, 40, 66, 104);
    ctx.fillStyle = '#ddd6c7';
    ctx.fillRect(58, 62, 26, 10);
    ctx.fillStyle = '#8fe5ff';
    ctx.fillRect(64, 64, 10, 6);
    ctx.fillStyle = '#f4d9d9';
    ctx.fillRect(24, 14, 5, 4);
    ctx.fillRect(42, 14, 5, 4);
  } else {
    ctx.fillStyle = `rgba(193, 72, 89, ${0.22 + Math.sin(worldTime * 8) * 0.06})`;
    ctx.beginPath();
    ctx.arc(42, 88, 84, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5c0f19';
    ctx.fillRect(8, 30, 74, 128);
    ctx.fillStyle = '#b95763';
    ctx.fillRect(18, 8, 46, 36);
    ctx.fillStyle = '#f6e4cb';
    ctx.fillRect(26, 16, 8, 8);
    ctx.fillRect(50, 16, 8, 8);
    ctx.fillStyle = '#762431';
    ctx.fillRect(0, 120, 96, 30);
    ctx.fillRect(18, 150, 24, 20);
    ctx.fillRect(56, 150, 24, 20);
  }

  ctx.restore();
};

const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
  const alpha = clamp(particle.life / particle.maxLife, 0, 1);
  ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
  if (!particle.color.startsWith('#')) {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = alpha;
  }
  ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  ctx.globalAlpha = 1;
};

const drawUI = (ctx: CanvasRenderingContext2D, state: RenderState) => {
  fillPanel(ctx, 24, 24, 260, 78, 'rgba(12, 12, 16, 0.72)', 'rgba(123, 74, 78, 0.8)');
  ctx.fillStyle = '#f0e6d7';
  ctx.font = 'bold 18px "Palatino Linotype", Georgia, serif';
  ctx.fillText('Hiệp Sĩ Đăng', 40, 50);
  fillPanel(ctx, 40, 60, 220, 16, '#341217');
  fillPanel(
    ctx,
    40,
    60,
    (220 * state.player.hp) / state.player.maxHp,
    16,
    state.player.hp < 36 ? '#d9485a' : '#c12a3b',
  );
  ctx.fillStyle = '#f0e6d7';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText(`Máu ${state.player.hp}/${state.player.maxHp}`, 42, 92);

  fillPanel(ctx, 302, 24, 220, 78, 'rgba(12, 12, 16, 0.72)', 'rgba(123, 74, 78, 0.8)');
  ctx.fillStyle = '#f0e6d7';
  ctx.font = 'bold 16px "Palatino Linotype", Georgia, serif';
  ctx.fillText('Mảnh linh hồn', 318, 48);
  ctx.font = 'bold 26px "Courier New", monospace';
  ctx.fillText(`${state.collectedCoins}/${state.totalCoins}`, 318, 84);
  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = state.loreUnlocked ? '#96f6ff' : '#b89ea4';
  ctx.fillText(state.loreUnlocked ? 'Ký ức của Dư đã mở.' : 'Thu đủ 10 để mở lore ẩn.', 318, 98);

  fillPanel(ctx, GAME_WIDTH - 328, 24, 304, 78, 'rgba(12, 12, 16, 0.72)', 'rgba(123, 74, 78, 0.8)');
  ctx.fillStyle = '#f0e6d7';
  ctx.font = 'bold 16px "Palatino Linotype", Georgia, serif';
  ctx.fillText('Mục tiêu', GAME_WIDTH - 312, 48);
  ctx.font = '14px "Courier New", monospace';
  const objectiveLines = wrapText(ctx, state.objectiveText, 272);
  objectiveLines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, GAME_WIDTH - 312, 70 + index * 18);
  });

  if (state.bossTriggered) {
    fillPanel(ctx, 340, 22, 600, 18, 'rgba(29, 8, 9, 0.8)', 'rgba(150, 60, 69, 0.9)');
    fillPanel(
      ctx,
      344,
      26,
      592 * (state.boss.hp / state.boss.maxHp),
      10,
      state.boss.phase === 2 ? '#ef5566' : '#c02f41',
    );
    ctx.fillStyle = '#f6e7d4';
    ctx.font = 'bold 14px "Palatino Linotype", Georgia, serif';
    ctx.fillText('Dr.Phieu', 612, 17);
  }

  fillPanel(ctx, 24, GAME_HEIGHT - 78, 360, 52, 'rgba(12, 12, 16, 0.62)', 'rgba(93, 67, 75, 0.76)');
  ctx.fillStyle = '#d8d1c9';
  ctx.font = '13px "Courier New", monospace';
  ctx.fillText('A/D hoặc mũi tên: di chuyển   Space: nhảy kép', 40, GAME_HEIGHT - 48);
  ctx.fillText('Shift: dash   J: chém   E/Enter: tiếp tục   Esc/P: pause', 40, GAME_HEIGHT - 28);

  if (state.banner) {
    const color =
      state.banner.tone === 'checkpoint'
        ? '#f2d08d'
        : state.banner.tone === 'lore'
          ? '#9ce4ff'
          : state.banner.tone === 'victory'
            ? '#f2dbc7'
            : '#ff9b87';
    fillPanel(
      ctx,
      GAME_WIDTH / 2 - 200,
      124,
      400,
      36,
      'rgba(10, 10, 14, 0.78)',
      'rgba(120, 72, 76, 0.88)',
    );
    ctx.fillStyle = color;
    ctx.font = 'bold 16px "Palatino Linotype", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.banner.text, GAME_WIDTH / 2, 148);
    ctx.textAlign = 'left';
  }
};

const drawDialogueOverlay = (ctx: CanvasRenderingContext2D, state: RenderState) => {
  if (!state.dialogue) {
    return;
  }

  const line = state.dialogue.lines[state.dialogue.index];
  fillPanel(ctx, 62, GAME_HEIGHT - 210, GAME_WIDTH - 124, 146, 'rgba(8, 8, 12, 0.86)', 'rgba(110, 68, 72, 0.88)');
  ctx.fillStyle = line.accent;
  ctx.font = 'bold 22px "Palatino Linotype", Georgia, serif';
  ctx.fillText(line.speaker, 90, GAME_HEIGHT - 172);
  ctx.fillStyle = '#f3ece0';
  ctx.font = '18px "Palatino Linotype", Georgia, serif';
  const lines = wrapText(ctx, line.text, GAME_WIDTH - 196);
  lines.forEach((textLine, index) => {
    ctx.fillText(textLine, 90, GAME_HEIGHT - 136 + index * 28);
  });
  ctx.fillStyle = '#b7a8ad';
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(state.dialogue.hint, GAME_WIDTH - 92, GAME_HEIGHT - 88);
  ctx.textAlign = 'left';
};

const drawPauseOverlay = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = 'rgba(3, 3, 5, 0.6)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  fillPanel(ctx, GAME_WIDTH / 2 - 190, GAME_HEIGHT / 2 - 88, 380, 176, 'rgba(9, 9, 14, 0.92)', 'rgba(127, 79, 84, 0.9)');
  ctx.fillStyle = '#f1e6d7';
  ctx.font = 'bold 34px "Palatino Linotype", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Tạm dừng', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18);
  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = '#c6b6bb';
  ctx.fillText('Nhấn Esc hoặc P để tiếp tục', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24);
  ctx.textAlign = 'left';
};

const drawGameOverOverlay = (ctx: CanvasRenderingContext2D, state: RenderState) => {
  ctx.fillStyle = 'rgba(3, 0, 0, 0.72)';
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  fillPanel(ctx, GAME_WIDTH / 2 - 240, GAME_HEIGHT / 2 - 120, 480, 220, 'rgba(10, 6, 8, 0.94)', 'rgba(150, 62, 68, 0.9)');
  ctx.fillStyle = '#f0d9c8';
  ctx.font = 'bold 40px "Palatino Linotype", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Hiệp sĩ Đăng gục ngã', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 34);
  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = '#d0bcc0';
  ctx.fillText(`Checkpoint hiện tại: ${state.activeCheckpointLabel}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16);
  ctx.fillText('Nhấn Enter hoặc R để trỗi dậy từ cột mốc gần nhất', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 48);
  ctx.textAlign = 'left';
};

const drawEndingOverlay = (ctx: CanvasRenderingContext2D, state: RenderState) => {
  if (state.phase === 'falseVictory') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1e6d1';
    ctx.font = 'bold 44px "Palatino Linotype", Georgia, serif';
    ctx.fillText('Dr.Phieu đã ngã...', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 12);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#d4c0c4';
    ctx.fillText('Pháo đài im lặng. Quá im lặng.', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24);
    ctx.textAlign = 'left';
  }

  if (state.phase === 'ending' && state.endingResolved) {
    ctx.fillStyle = 'rgba(6, 2, 2, 0.82)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    fillPanel(ctx, GAME_WIDTH / 2 - 280, GAME_HEIGHT / 2 - 140, 560, 260, 'rgba(9, 6, 8, 0.96)', 'rgba(130, 58, 64, 0.92)');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0d7c4';
    ctx.font = 'bold 40px "Palatino Linotype", Georgia, serif';
    ctx.fillText('Hiệp Sĩ Đăng: Pháo Đài Máu', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 42);
    ctx.font = '20px "Palatino Linotype", Georgia, serif';
    ctx.fillStyle = '#ffb7b2';
    ctx.fillText('Không có chiến thắng nào ở đây.', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 2);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#d0bcc0';
    ctx.fillText('Đăng thất bại. Dr.Phieu có được nguyên liệu cuối cùng.', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 38);
    ctx.fillText('Nhấn Enter hoặc R để mở lại cánh cổng máu.', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);
    ctx.textAlign = 'left';
  }
};

const drawLowHealthVignette = (ctx: CanvasRenderingContext2D, state: RenderState) => {
  if (state.lowHealthEffect <= 0.01) {
    return;
  }

  const gradient = ctx.createRadialGradient(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    120,
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH * 0.78,
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(80, 0, 0, ${0.28 + state.lowHealthEffect * 0.35})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
};

export const renderBloodFortress = (ctx: CanvasRenderingContext2D, state: RenderState) => {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  drawSky(ctx, state);
  drawGroundVeins(ctx, state);

  ctx.save();
  ctx.translate(-state.camera.x + state.camera.shakeX, -state.camera.y + state.camera.shakeY);

  state.decorations.forEach((decoration) => drawDecoration(ctx, decoration, state.worldTime));
  state.platforms.forEach((platform) => drawPlatform(ctx, platform));
  state.traps.forEach((trap) => drawTrap(ctx, trap));
  state.coins.forEach((coin) => drawCoin(ctx, coin, state.worldTime));
  state.checkpoints.forEach((checkpoint) => drawCheckpoint(ctx, checkpoint, state.worldTime));
  state.projectiles.forEach((projectile) => drawProjectile(ctx, projectile));
  drawBoss(ctx, state.boss, state.worldTime);
  drawPlayer(ctx, state);
  state.particles.forEach((particle) => drawParticle(ctx, particle));

  ctx.restore();

  drawLowHealthVignette(ctx, state);
  drawUI(ctx, state);
  drawDialogueOverlay(ctx, state);

  if (state.phase === 'paused') {
    drawPauseOverlay(ctx);
  }

  if (state.phase === 'gameOver') {
    drawGameOverOverlay(ctx, state);
  }

  if (state.phase === 'falseVictory' || (state.phase === 'ending' && state.endingResolved)) {
    drawEndingOverlay(ctx, state);
  }
};
