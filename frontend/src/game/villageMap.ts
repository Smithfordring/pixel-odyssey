import { PLAYER_HITBOX, TILE_SIZE } from './config'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface House {
  x: number
  y: number
  width: number
  height: number
  baseHeight: number
}

export interface Tree {
  x: number
  y: number
}

export type DecorKind = 'flower' | 'stone' | 'tuft'

export interface Decor {
  x: number
  y: number
  kind: DecorKind
}

export const VILLAGE_EVENTS = {
  prompt: 'village-prompt',
  dialogue: 'village-dialogue',
  closeDialogue: 'village-dialogue-request-close',
} as const

const roadTiles: Array<{ col: number; row: number }> = []

for (let row = 10; row <= 15; row += 1) {
  for (let col = 12; col <= 27; col += 1) {
    roadTiles.push({ col, row })
  }
}

for (let row = 16; row <= 29; row += 1) {
  for (let col = 18; col <= 21; col += 1) {
    roadTiles.push({ col, row })
  }
}

export { roadTiles }

export const houses: House[] = [
  { x: 96, y: 64, width: 128, height: 112, baseHeight: 40 },
  { x: 1056, y: 64, width: 128, height: 112, baseHeight: 40 },
  { x: 96, y: 624, width: 128, height: 112, baseHeight: 40 },
  { x: 1056, y: 640, width: 128, height: 112, baseHeight: 40 },
]

export const trees: Tree[] = [
  { x: 48, y: 200 },
  { x: 48, y: 430 },
  { x: 48, y: 760 },
  { x: 240, y: 300 },
  { x: 1232, y: 220 },
  { x: 1232, y: 500 },
  { x: 1232, y: 860 },
  { x: 360, y: 720 },
  { x: 920, y: 720 },
  { x: 200, y: 900 },
]

export const fences: Rect[] = [
  { x: 320, y: 640, width: 224, height: 12 },
  { x: 736, y: 640, width: 224, height: 12 },
  { x: 320, y: 864, width: 224, height: 12 },
  { x: 736, y: 864, width: 224, height: 12 },
]

export const decor: Decor[] = [
  { x: 280, y: 150, kind: 'flower' },
  { x: 304, y: 176, kind: 'flower' },
  { x: 700, y: 250, kind: 'tuft' },
  { x: 860, y: 270, kind: 'stone' },
  { x: 150, y: 520, kind: 'stone' },
  { x: 1000, y: 540, kind: 'tuft' },
  { x: 470, y: 600, kind: 'flower' },
  { x: 830, y: 590, kind: 'tuft' },
  { x: 250, y: 800, kind: 'flower' },
  { x: 1100, y: 810, kind: 'stone' },
  { x: 640, y: 270, kind: 'flower' },
  { x: 1180, y: 360, kind: 'tuft' },
]

export const npc = { x: 540, y: 440 }
export const playerSpawn = { x: 640, y: 900, facing: 'up' as const }
export const villageSign = { x: 400, y: 800 }

export function houseCollision(house: House): Rect {
  const inset = 6
  return {
    x: house.x + inset,
    y: house.y + house.height - house.baseHeight,
    width: house.width - inset * 2,
    height: house.baseHeight,
  }
}

export function treeCollision(tree: Tree): Rect {
  return {
    x: tree.x - 7,
    y: tree.y - 16,
    width: 14,
    height: 16,
  }
}

export function fenceCollision(fence: Rect): Rect {
  return {
    x: fence.x,
    y: fence.y - 8,
    width: fence.width,
    height: fence.height + 14,
  }
}

export const obstacles: Rect[] = [
  ...houses.map(houseCollision),
  ...trees.map(treeCollision),
  ...fences.map(fenceCollision),
]

export function movementBlocked(x: number, y: number): boolean {
  const left = x - PLAYER_HITBOX.halfWidth
  const right = x + PLAYER_HITBOX.halfWidth
  const top = y + PLAYER_HITBOX.offsetY - PLAYER_HITBOX.halfHeight
  const bottom = y + PLAYER_HITBOX.offsetY + PLAYER_HITBOX.halfHeight

  return obstacles.some(
    (rect) => right > rect.x && left < rect.x + rect.width && bottom > rect.y && top < rect.y + rect.height,
  )
}

export function validateVillage(): void {
  const samples: Array<{ x: number; y: number }> = []
  for (let y = 900; y >= 450; y -= 8) {
    samples.push({ x: 640, y })
  }
  for (let x = 640; x >= 548; x -= 8) {
    samples.push({ x, y: 440 })
  }

  for (const point of samples) {
    if (movementBlocked(point.x, point.y)) {
      throw new Error(`Village path is blocked at ${point.x}, ${point.y}`)
    }
  }

  if (movementBlocked(playerSpawn.x, playerSpawn.y) || movementBlocked(npc.x, npc.y)) {
    throw new Error('Village spawn or NPC overlaps an obstacle')
  }

  const firstHouse = houseCollision(houses[0])
  const blockedX = firstHouse.x + firstHouse.width / 2
  const blockedY = firstHouse.y + firstHouse.height / 2 - PLAYER_HITBOX.offsetY
  if (!movementBlocked(blockedX, blockedY)) {
    throw new Error('House collision did not cover the building base')
  }
}

export function tileOrigin(col: number, row: number): { x: number; y: number } {
  return { x: col * TILE_SIZE, y: row * TILE_SIZE }
}
