import { createId } from './constants';
import type { Coin, Particle, Player } from './types';

export const countCollectedCoins = (coins: Coin[]) => coins.filter((coin) => coin.collected).length;

export const collectCoins = (
  player: Player,
  coins: Coin[],
  worldTime: number,
  particles: Particle[],
) => {
  let newlyCollected = 0;

  coins.forEach((coin) => {
    if (coin.collected) {
      return;
    }

    const bobY = coin.y + Math.sin(worldTime * 2.6 + coin.bobOffset) * 6;
    const dx = player.x + player.width / 2 - coin.x;
    const dy = player.y + player.height / 2 - bobY;
    if (dx * dx + dy * dy > 28 * 28) {
      return;
    }

    coin.collected = true;
    newlyCollected += 1;

    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10;
      particles.push({
        id: createId('particle'),
        x: coin.x,
        y: bobY,
        vx: Math.cos(angle) * 90,
        vy: Math.sin(angle) * 90 - 40,
        life: 0.52,
        maxLife: 0.52,
        size: 4 + (index % 3),
        color: coin.kind === 'eye' ? '#f8de92' : coin.kind === 'soul' ? '#99f0ff' : '#f44369',
        kind: coin.kind === 'soul' ? 'soul' : 'spark',
      });
    }
  });

  return newlyCollected;
};
