import type { Rect } from './types';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const WORLD_FLOOR_Y = 610;
export const WORLD_END_X = 6680;
export const BOSS_ARENA_START = 5520;
export const BOSS_ARENA_END = 6640;
export const PLAYER_START_X = 90;
export const PLAYER_START_Y = 500;

export const PLAYER_WIDTH = 46;
export const PLAYER_HEIGHT = 78;
export const PLAYER_MOVE_SPEED = 320;
export const PLAYER_GROUND_ACCEL = 2400;
export const PLAYER_AIR_ACCEL = 1850;
export const PLAYER_FRICTION = 2400;
export const PLAYER_GRAVITY = 1850;
export const PLAYER_MAX_FALL_SPEED = 960;
export const PLAYER_JUMP_FORCE = 690;
export const PLAYER_DASH_SPEED = 720;
export const PLAYER_DASH_TIME = 0.16;
export const PLAYER_DASH_COOLDOWN = 0.68;
export const PLAYER_ATTACK_TIME = 0.18;
export const PLAYER_ATTACK_COOLDOWN = 0.28;
export const PLAYER_ATTACK_DAMAGE = 18;
export const PLAYER_MAX_HP = 120;
export const PLAYER_COYOTE_TIME = 0.12;
export const PLAYER_JUMP_BUFFER = 0.14;

export const BOSS_MAX_HP = 260;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const lerp = (start: number, end: number, amount: number) =>
  start + (end - start) * amount;

export const intersects = (first: Rect, second: Rect) =>
  first.x < second.x + second.width &&
  first.x + first.width > second.x &&
  first.y < second.y + second.height &&
  first.y + first.height > second.y;

export const centerX = (rect: Rect) => rect.x + rect.width / 2;
export const centerY = (rect: Rect) => rect.y + rect.height / 2;

export const horizontalDistance = (first: Rect, second: Rect) =>
  Math.abs(centerX(first) - centerX(second));

let entityCounter = 0;

export const createId = (prefix: string) => {
  entityCounter += 1;
  return `${prefix}-${entityCounter}`;
};
