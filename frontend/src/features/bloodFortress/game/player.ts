import {
  PLAYER_ATTACK_COOLDOWN,
  PLAYER_ATTACK_DAMAGE,
  PLAYER_ATTACK_TIME,
  PLAYER_COYOTE_TIME,
  PLAYER_DASH_COOLDOWN,
  PLAYER_DASH_SPEED,
  PLAYER_DASH_TIME,
  PLAYER_FRICTION,
  PLAYER_GROUND_ACCEL,
  PLAYER_AIR_ACCEL,
  PLAYER_GRAVITY,
  PLAYER_HEIGHT,
  PLAYER_JUMP_BUFFER,
  PLAYER_JUMP_FORCE,
  PLAYER_MAX_FALL_SPEED,
  PLAYER_MAX_HP,
  PLAYER_MOVE_SPEED,
  PLAYER_WIDTH,
  clamp,
  intersects,
} from './constants';
import type { InputState, Platform, Player, Rect } from './types';

export const createPlayer = (x: number, y: number): Player => ({
  x,
  y,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  vx: 0,
  vy: 0,
  hp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
  direction: 1,
  onGround: false,
  coyoteTimer: 0,
  jumpBuffer: 0,
  extraJumpsRemaining: 1,
  canDash: true,
  dashTimer: 0,
  dashCooldown: 0,
  attackTimer: 0,
  attackCooldown: 0,
  attackConnected: false,
  invulnTimer: 0,
});

const solidPlatforms = (platforms: Platform[]) => platforms.filter((platform) => !platform.collapsed);

export const getPlayerAttackRect = (player: Player): Rect | null => {
  if (player.attackTimer <= 0.04) {
    return null;
  }

  const reach = 58;
  return {
    x: player.direction > 0 ? player.x + player.width - 4 : player.x - reach + 4,
    y: player.y + 18,
    width: reach,
    height: 30,
  };
};

export const getPlayerAttackDamage = () => PLAYER_ATTACK_DAMAGE;

export const respawnPlayer = (player: Player, x: number, y: number) => {
  player.x = x;
  player.y = y;
  player.vx = 0;
  player.vy = 0;
  player.hp = player.maxHp;
  player.onGround = false;
  player.coyoteTimer = 0;
  player.jumpBuffer = 0;
  player.extraJumpsRemaining = 1;
  player.canDash = true;
  player.dashTimer = 0;
  player.dashCooldown = 0;
  player.attackTimer = 0;
  player.attackCooldown = 0;
  player.attackConnected = false;
  player.invulnTimer = 0.8;
};

export const damagePlayer = (player: Player, amount: number, knockbackX: number, knockbackY: number) => {
  if (player.invulnTimer > 0) {
    return false;
  }

  player.hp = clamp(player.hp - amount, 0, player.maxHp);
  player.invulnTimer = 0.95;
  player.vx = knockbackX;
  player.vy = knockbackY;
  player.dashTimer = 0;
  return true;
};

const movePlayerHorizontally = (player: Player, dt: number, platforms: Platform[]) => {
  player.x += player.vx * dt;

  solidPlatforms(platforms).forEach((platform) => {
    if (!intersects(player, platform)) {
      return;
    }

    if (player.vx > 0) {
      player.x = platform.x - player.width;
    } else if (player.vx < 0) {
      player.x = platform.x + platform.width;
    }

    player.vx = 0;
  });
};

const movePlayerVertically = (player: Player, dt: number, platforms: Platform[]) => {
  player.onGround = false;
  player.y += player.vy * dt;

  solidPlatforms(platforms).forEach((platform) => {
    if (!intersects(player, platform)) {
      return;
    }

    if (player.vy > 0) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.onGround = true;
      player.coyoteTimer = PLAYER_COYOTE_TIME;
      player.extraJumpsRemaining = 1;
      player.canDash = true;

      if (platform.crumble && !platform.collapsed && (platform.collapseTimer ?? 0) <= 0) {
        platform.collapseTimer = platform.collapseDelay ?? 0.35;
      }
    } else if (player.vy < 0) {
      player.y = platform.y + platform.height;
      player.vy = 0;
    }
  });
};

export const updatePlayer = (
  player: Player,
  input: InputState,
  dt: number,
  platforms: Platform[],
) => {
  player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  if (player.attackTimer <= 0) {
    player.attackConnected = false;
  }
  player.coyoteTimer = player.onGround ? PLAYER_COYOTE_TIME : Math.max(0, player.coyoteTimer - dt);
  player.jumpBuffer = input.jump ? PLAYER_JUMP_BUFFER : Math.max(0, player.jumpBuffer - dt);

  const wantsMove = Number(input.right) - Number(input.left);
  if (wantsMove !== 0) {
    player.direction = wantsMove > 0 ? 1 : -1;
  }

  if (input.dash && player.canDash && player.dashCooldown <= 0) {
    player.canDash = false;
    player.dashTimer = PLAYER_DASH_TIME;
    player.dashCooldown = PLAYER_DASH_COOLDOWN;
    player.vx = player.direction * PLAYER_DASH_SPEED;
    player.vy = 0;
    player.invulnTimer = Math.max(player.invulnTimer, 0.18);
  }

  if (input.attack && player.attackCooldown <= 0) {
    player.attackTimer = PLAYER_ATTACK_TIME;
    player.attackCooldown = PLAYER_ATTACK_COOLDOWN;
    player.attackConnected = false;
  }

  if (player.jumpBuffer > 0) {
    if (player.coyoteTimer > 0) {
      player.vy = -PLAYER_JUMP_FORCE;
      player.onGround = false;
      player.coyoteTimer = 0;
      player.jumpBuffer = 0;
    } else if (player.extraJumpsRemaining > 0) {
      player.extraJumpsRemaining -= 1;
      player.vy = -PLAYER_JUMP_FORCE * 0.92;
      player.jumpBuffer = 0;
      player.onGround = false;
      player.canDash = true;
    }
  }

  if (player.dashTimer > 0) {
    player.dashTimer = Math.max(0, player.dashTimer - dt);
    player.vx = player.direction * PLAYER_DASH_SPEED;
    player.vy = 0;
  } else {
    const acceleration = player.onGround ? PLAYER_GROUND_ACCEL : PLAYER_AIR_ACCEL;

    if (wantsMove !== 0) {
      player.vx += wantsMove * acceleration * dt;
    } else if (player.onGround) {
      const frictionAmount = PLAYER_FRICTION * dt;
      if (Math.abs(player.vx) <= frictionAmount) {
        player.vx = 0;
      } else {
        player.vx -= Math.sign(player.vx) * frictionAmount;
      }
    }

    player.vx = clamp(player.vx, -PLAYER_MOVE_SPEED, PLAYER_MOVE_SPEED);
    player.vy = clamp(player.vy + PLAYER_GRAVITY * dt, -PLAYER_JUMP_FORCE, PLAYER_MAX_FALL_SPEED);
  }

  movePlayerHorizontally(player, dt, platforms);
  movePlayerVertically(player, dt, platforms);
};
