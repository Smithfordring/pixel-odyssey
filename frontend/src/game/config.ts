import Phaser from 'phaser'
import { WorldScene } from './scenes/WorldScene'

export const VIEW_WIDTH = 480
export const VIEW_HEIGHT = 270
export const TILE_SIZE = 32
export const MAP_COLUMNS = 40
export const MAP_ROWS = 30
export const WORLD_WIDTH = TILE_SIZE * MAP_COLUMNS
export const WORLD_HEIGHT = TILE_SIZE * MAP_ROWS
export const CAMERA_ZOOM = 2
export const CAMERA_LERP = 0.12
export const PLAYER_SPEED = 160
export const INTERACT_RADIUS = 72

export const PLAYER_HITBOX = {
  halfWidth: 7,
  halfHeight: 5,
  offsetY: 10,
}

export const PLAYER_BOUNDS = {
  minX: PLAYER_HITBOX.halfWidth + 4,
  maxX: WORLD_WIDTH - PLAYER_HITBOX.halfWidth - 4,
  minY: 24,
  maxY: WORLD_HEIGHT - PLAYER_HITBOX.offsetY - PLAYER_HITBOX.halfHeight - 4,
}

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    backgroundColor: '#2f6b32',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    banner: false,
    audio: { noAudio: true },
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true,
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      zoom: 1,
    },
    scene: [WorldScene],
  }
}
