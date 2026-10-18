import Phaser from 'phaser'

export type PlayerFacing = 'down' | 'left' | 'right' | 'up'

export const PLAYER_SHEET_KEY = 'player'
export const PLAYER_SHEET_PATH = '/assets/characters/player/player.png'
export const PLAYER_FRAME_WIDTH = 32
export const PLAYER_FRAME_HEIGHT = 48
export const PLAYER_FRAME_COLUMNS = 4
export const PLAYER_FRAME_ROWS = 4
export const PLAYER_SHEET_WIDTH = PLAYER_FRAME_WIDTH * PLAYER_FRAME_COLUMNS
export const PLAYER_SHEET_HEIGHT = PLAYER_FRAME_HEIGHT * PLAYER_FRAME_ROWS
export const PLAYER_WALK_FRAME_RATE = 8

/**
 * Local Y of the placeholder body's bottom edge.
 * A loaded sprite uses this as its foot point so the picture lines up with the
 * existing character. Collision stays on PLAYER_HITBOX and does not follow the frame.
 */
export const PLAYER_FEET_LOCAL_Y = 16

const ROW_START: Record<PlayerFacing, number> = {
  down: 0,
  left: PLAYER_FRAME_COLUMNS,
  right: PLAYER_FRAME_COLUMNS * 2,
  up: PLAYER_FRAME_COLUMNS * 3,
}

export function playerWalkAnimationKey(facing: PlayerFacing): string {
  return `player-walk-${facing}`
}

export function playerIdleFrame(facing: PlayerFacing): number {
  return ROW_START[facing]
}

export function playerSheetHasExpectedSize(textures: Phaser.Textures.TextureManager): boolean {
  if (!textures.exists(PLAYER_SHEET_KEY)) {
    return false
  }

  const source = textures.get(PLAYER_SHEET_KEY).getSourceImage()
  return source.width === PLAYER_SHEET_WIDTH && source.height === PLAYER_SHEET_HEIGHT
}

export function ensurePlayerWalkAnimations(anims: Phaser.Animations.AnimationManager): void {
  const facings: PlayerFacing[] = ['down', 'left', 'right', 'up']
  for (const facing of facings) {
    const key = playerWalkAnimationKey(facing)
    if (anims.exists(key)) {
      continue
    }

    const start = ROW_START[facing]
    anims.create({
      key,
      frames: anims.generateFrameNumbers(PLAYER_SHEET_KEY, { start, end: start + PLAYER_FRAME_COLUMNS - 1 }),
      frameRate: PLAYER_WALK_FRAME_RATE,
      repeat: -1,
    })
  }
}

export function playerSheetFailureMessage(reason: string): string {
  return (
    `[Pixel Odyssey] ${reason} Path: ${PLAYER_SHEET_PATH}. ` +
    `Expected ${PLAYER_SHEET_WIDTH}x${PLAYER_SHEET_HEIGHT} pixels, ` +
    `${PLAYER_FRAME_ROWS} rows by ${PLAYER_FRAME_COLUMNS} frames, ` +
    `each frame ${PLAYER_FRAME_WIDTH}x${PLAYER_FRAME_HEIGHT}, no padding, transparent background. ` +
    `Row order: down, left, right, up. The drawn placeholder stays in use.`
  )
}
