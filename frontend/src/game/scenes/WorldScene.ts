import Phaser from 'phaser'
import {
  CAMERA_LERP,
  CAMERA_ZOOM,
  INTERACT_RADIUS,
  PLAYER_BOUNDS,
  PLAYER_HITBOX,
  PLAYER_SPEED,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../config'
import {
  PLAYER_FEET_LOCAL_Y,
  PLAYER_FRAME_HEIGHT,
  PLAYER_FRAME_WIDTH,
  PLAYER_SHEET_HEIGHT,
  PLAYER_SHEET_KEY,
  PLAYER_SHEET_PATH,
  PLAYER_SHEET_WIDTH,
  ensurePlayerWalkAnimations,
  playerIdleFrame,
  playerSheetFailureMessage,
  playerSheetHasExpectedSize,
  playerWalkAnimationKey,
  type PlayerFacing,
} from '../playerSprite'
import {
  decor,
  fences,
  houses,
  movementBlocked,
  npc,
  playerSpawn,
  roadTiles,
  tileOrigin,
  trees,
  validateVillage,
  villageSign,
  VILLAGE_EVENTS,
  type House,
  type Rect,
  type Tree,
} from '../villageMap'

type Facing = PlayerFacing

interface WasdKeys {
  W: Phaser.Input.Keyboard.Key
  A: Phaser.Input.Keyboard.Key
  S: Phaser.Input.Keyboard.Key
  D: Phaser.Input.Keyboard.Key
}

const NOSE_OFFSET: Record<Facing, { x: number; y: number }> = {
  down: { x: 0, y: 4 },
  up: { x: 0, y: -18 },
  left: { x: -10, y: -12 },
  right: { x: 10, y: -12 },
}

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container
  private playerSprite: Phaser.GameObjects.Sprite | null = null
  private nose: Phaser.GameObjects.Rectangle | null = null
  private title!: Phaser.GameObjects.Text
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null
  private wasd: WasdKeys | null = null
  private interactKey: Phaser.Input.Keyboard.Key | null = null
  private escKey: Phaser.Input.Keyboard.Key | null = null
  private facing: Facing = playerSpawn.facing
  private playerX = playerSpawn.x
  private playerY = playerSpawn.y
  private promptVisible = false
  private dialogueOpen = false
  private playerSheetFailed = false
  private playerSheetLoaded = false

  constructor() {
    super('world')
  }

  preload() {
    this.playerSheetFailed = false
    this.playerSheetLoaded = false
    this.load.spritesheet(PLAYER_SHEET_KEY, PLAYER_SHEET_PATH, {
      frameWidth: PLAYER_FRAME_WIDTH,
      frameHeight: PLAYER_FRAME_HEIGHT,
    })
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, this.onPlayerSheetError, this)
    this.load.once(`filecomplete-spritesheet-${PLAYER_SHEET_KEY}`, this.onPlayerSheetLoaded, this)
  }

  create() {
    validateVillage()
    this.drawGrass()
    this.drawRoads()
    this.drawDecor()
    this.drawHouses()
    this.drawTrees()
    this.drawFences()
    this.drawSign()
    this.drawBorder()
    this.createNpc()
    this.createPlayer()
    this.createTitle()
    this.bindInput()
    this.game.events.on(VILLAGE_EVENTS.closeDialogue, this.onDialogueCloseRequest, this)
    this.configureCamera()
    this.pinTitle()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this)
  }

  update(_time: number, delta: number) {
    this.pinTitle()
    if (!this.canMove()) {
      this.showIdlePose()
      return
    }

    this.updateInteraction()
    if (this.dialogueOpen) {
      this.showIdlePose()
      return
    }

    const input = this.readMovement()
    if (!input) {
      this.showIdlePose()
      return
    }

    this.facing = input.facing

    const step = PLAYER_SPEED * (delta / 1000)
    const slices = Math.max(1, Math.ceil(step / 4))
    const slice = step / slices
    for (let index = 0; index < slices; index += 1) {
      let nextX = Phaser.Math.Clamp(
        this.playerX + input.x * slice,
        PLAYER_BOUNDS.minX,
        PLAYER_BOUNDS.maxX,
      )
      let nextY = Phaser.Math.Clamp(
        this.playerY + input.y * slice,
        PLAYER_BOUNDS.minY,
        PLAYER_BOUNDS.maxY,
      )
      if (movementBlocked(nextX, this.playerY)) {
        nextX = this.playerX
      }
      if (movementBlocked(nextX, nextY)) {
        nextY = this.playerY
      }
      if (nextX === this.playerX && nextY === this.playerY) {
        break
      }
      this.playerX = nextX
      this.playerY = nextY
    }

    this.player.setPosition(Math.round(this.playerX), Math.round(this.playerY))
    this.player.setDepth(this.playerY + PLAYER_HITBOX.offsetY + PLAYER_HITBOX.halfHeight)
    this.showWalkPose()
  }

  private drawGrass() {
    const key = 'grass-tile'
    if (!this.textures.exists(key)) {
      const texture = this.textures.createCanvas(key, TILE_SIZE, TILE_SIZE)
      const context = texture?.getContext()
      if (texture && context) {
        context.fillStyle = '#3c8c38'
        context.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
        context.fillStyle = '#2f7030'
        context.fillRect(3, 5, 2, 7)
        context.fillRect(20, 18, 2, 6)
        context.fillRect(14, 2, 2, 4)
        context.fillStyle = '#6fbf55'
        context.fillRect(8, 14, 2, 5)
        context.fillRect(26, 8, 2, 6)
        context.fillStyle = '#d9e38a'
        context.fillRect(11, 24, 2, 2)
        context.fillRect(23, 27, 2, 2)
        texture.refresh()
      }
    }

    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, key).setOrigin(0, 0).setDepth(0)
  }

  private drawRoads() {
    const road = this.add.graphics().setDepth(1)
    const roadSet = new Set(roadTiles.map((tile) => `${tile.col},${tile.row}`))
    const isRoad = (col: number, row: number) => roadSet.has(`${col},${row}`)

    for (const tile of roadTiles) {
      const { x, y } = tileOrigin(tile.col, tile.row)
      road.fillStyle(0xc4a574)
      road.fillRect(x, y, TILE_SIZE, TILE_SIZE)
      if ((tile.col * 3 + tile.row) % 5 === 0) {
        road.fillStyle(0xa68458)
        road.fillRect(x + 7, y + 12, 4, 3)
        road.fillRect(x + 18, y + 20, 3, 2)
      }
      road.fillStyle(0x8a6a3b)
      if (!isRoad(tile.col, tile.row - 1)) road.fillRect(x, y, TILE_SIZE, 2)
      if (!isRoad(tile.col, tile.row + 1)) road.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2)
      if (!isRoad(tile.col - 1, tile.row)) road.fillRect(x, y, 2, TILE_SIZE)
      if (!isRoad(tile.col + 1, tile.row)) road.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE)
    }
  }

  private drawDecor() {
    const layer = this.add.graphics().setDepth(2)
    for (const item of decor) {
      if (item.kind === 'flower') {
        layer.fillStyle(0x166534)
        layer.fillRect(item.x - 1, item.y, 2, 6)
        layer.fillStyle(0xf472b6)
        layer.fillRect(item.x - 3, item.y - 3, 3, 3)
        layer.fillStyle(0xfacc15)
        layer.fillRect(item.x + 1, item.y - 2, 3, 3)
      } else if (item.kind === 'stone') {
        layer.fillStyle(0x292524)
        layer.fillRect(item.x - 6, item.y - 3, 12, 8)
        layer.fillStyle(0x78716c)
        layer.fillRect(item.x - 5, item.y - 2, 10, 6)
      } else {
        layer.fillStyle(0x14532d)
        layer.fillRect(item.x - 4, item.y, 3, 6)
        layer.fillRect(item.x, item.y - 2, 3, 8)
        layer.fillRect(item.x + 3, item.y + 1, 3, 5)
      }
    }
  }

  private drawHouses() {
    for (const house of houses) {
      const graphic = this.add.graphics()
      this.paintHouse(graphic, house)
      graphic.setDepth(house.y + house.height)
    }
  }

  private paintHouse(graphic: Phaser.GameObjects.Graphics, house: House) {
    const roofHeight = house.height - house.baseHeight
    const wallY = house.y + roofHeight
    graphic.fillStyle(0x7f1d1d)
    graphic.fillRect(house.x - 4, house.y - 2, house.width + 8, roofHeight + 2)
    graphic.fillStyle(0xb91c1c)
    graphic.fillRect(house.x, house.y, house.width, roofHeight)
    graphic.fillStyle(0x991b1b)
    graphic.fillRect(house.x + 8, house.y + 8, house.width - 16, 4)
    graphic.fillStyle(0x713f12)
    graphic.fillRect(house.x - 2, wallY, house.width + 4, house.baseHeight)
    graphic.fillStyle(0xd97706)
    graphic.fillRect(house.x, wallY + 2, house.width, house.baseHeight - 2)
    graphic.fillStyle(0xbae6fd)
    graphic.fillRect(house.x + 12, wallY + 10, 12, 10)
    graphic.fillRect(house.x + house.width - 24, wallY + 10, 12, 10)
    graphic.fillStyle(0x44403c)
    graphic.fillRect(house.x + house.width / 2 - 8, wallY + 12, 16, house.baseHeight - 12)
  }

  private drawTrees() {
    for (const tree of trees) {
      const graphic = this.add.graphics()
      this.paintTree(graphic, tree)
      graphic.setDepth(tree.y)
    }
  }

  private paintTree(graphic: Phaser.GameObjects.Graphics, tree: Tree) {
    graphic.fillStyle(0x14532d)
    graphic.fillRect(tree.x - 16, tree.y - 40, 32, 24)
    graphic.fillStyle(0x166534)
    graphic.fillRect(tree.x - 14, tree.y - 38, 28, 20)
    graphic.fillStyle(0x4ade80)
    graphic.fillRect(tree.x - 8, tree.y - 34, 6, 4)
    graphic.fillStyle(0x78350f)
    graphic.fillRect(tree.x - 4, tree.y - 18, 8, 18)
    graphic.fillStyle(0x451a03)
    graphic.fillRect(tree.x - 5, tree.y - 18, 2, 18)
  }

  private drawFences() {
    for (const fence of fences) {
      const graphic = this.add.graphics()
      this.paintFence(graphic, fence)
      graphic.setDepth(fence.y + fence.height)
    }
  }

  private paintFence(graphic: Phaser.GameObjects.Graphics, fence: Rect) {
    graphic.fillStyle(0x44403c)
    for (let x = fence.x; x <= fence.x + fence.width - 4; x += 16) {
      graphic.fillRect(x, fence.y - 10, 4, fence.height + 10)
    }
    graphic.fillStyle(0xd6d3d1)
    graphic.fillRect(fence.x, fence.y, fence.width, 4)
    graphic.fillStyle(0xa8a29e)
    graphic.fillRect(fence.x, fence.y + 6, fence.width, 3)
  }

  private drawSign() {
    const post = this.add.graphics()
    post.fillStyle(0x78350f)
    post.fillRect(villageSign.x, villageSign.y, 36, 16)
    post.fillStyle(0x451a03)
    post.fillRect(villageSign.x + 14, villageSign.y + 16, 6, 12)
    post.setDepth(villageSign.y)
    this.add
      .text(villageSign.x + 4, villageSign.y + 2, '晨曦村', {
        fontFamily: 'Consolas, monospace',
        fontSize: '10px',
        color: '#fef3c7',
      })
      .setDepth(villageSign.y + 1)
  }

  private drawBorder() {
    const border = this.add.graphics().setDepth(3)
    border.lineStyle(4, 0x14532d, 1)
    border.strokeRect(2, 2, WORLD_WIDTH - 4, WORLD_HEIGHT - 4)
  }

  private createNpc() {
    const body = this.add.graphics()
    body.fillStyle(0x14532d, 0.45)
    body.fillRect(-8, 12, 16, 4)
    body.fillStyle(0x78350f)
    body.fillRect(-10, -22, 20, 4)
    body.fillStyle(0xf59e0b)
    body.fillRect(-6, -28, 12, 8)
    body.fillStyle(0x7c2d12)
    body.fillRect(-7, -18, 14, 12)
    body.fillStyle(0xfde68a)
    body.fillRect(-6, -17, 12, 10)
    body.fillStyle(0x1c1917)
    body.fillRect(-4, -14, 2, 2)
    body.fillRect(2, -14, 2, 2)
    body.fillStyle(0x9a3412)
    body.fillRect(-8, -6, 16, 18)
    body.fillStyle(0xea580c)
    body.fillRect(-7, -5, 14, 16)
    body.fillStyle(0xfde68a)
    body.fillRect(6, -12, 3, 3)

    const villager = this.add.container(npc.x, npc.y, [body])
    villager.setDepth(npc.y + PLAYER_HITBOX.offsetY + PLAYER_HITBOX.halfHeight)
  }

  private createPlayer() {
    if (this.canUsePlayerSheet()) {
      ensurePlayerWalkAnimations(this.anims)
      const sprite = this.add.sprite(0, PLAYER_FEET_LOCAL_Y, PLAYER_SHEET_KEY, playerIdleFrame(this.facing))
      sprite.setOrigin(0.5, 1)
      this.playerSprite = sprite
      this.nose = null
      this.player = this.add.container(this.playerX, this.playerY, [sprite])
    } else {
      this.playerSprite = null
      this.player = this.add.container(this.playerX, this.playerY, this.createPlaceholderParts())
    }

    this.player.setDepth(this.playerY + PLAYER_HITBOX.offsetY + PLAYER_HITBOX.halfHeight)
    this.showIdlePose()
  }

  private canUsePlayerSheet(): boolean {
    if (this.playerSheetFailed) {
      return false
    }
    if (!this.playerSheetLoaded || !this.textures.exists(PLAYER_SHEET_KEY)) {
      console.error(playerSheetFailureMessage('Player sprite sheet is not available.'))
      return false
    }
    if (!playerSheetHasExpectedSize(this.textures)) {
      console.error(
        playerSheetFailureMessage(
          `Player sprite sheet is ${this.sheetSizeLabel()}, not ${PLAYER_SHEET_WIDTH}x${PLAYER_SHEET_HEIGHT}.`,
        ),
      )
      return false
    }
    return true
  }

  private sheetSizeLabel(): string {
    const source = this.textures.get(PLAYER_SHEET_KEY).getSourceImage()
    return `${source.width}x${source.height}`
  }

  private createPlaceholderParts(): Phaser.GameObjects.GameObject[] {
    const body = this.add.graphics()
    body.fillStyle(0x14532d, 0.45)
    body.fillEllipse(0, 16, 18, 6)
    body.fillStyle(0x0f3d3a)
    body.fillCircle(0, -12, 9)
    body.fillRoundedRect(-9, -2, 18, 20, 3)
    body.fillStyle(0x99f6e4)
    body.fillCircle(0, -12, 7)
    body.fillStyle(0x0f766e)
    body.fillRoundedRect(-7, 0, 14, 16, 3)
    body.fillStyle(0x042f2e)
    body.fillRect(-4, -14, 2, 2)
    body.fillRect(2, -14, 2, 2)

    const nose = this.add.rectangle(0, 4, 4, 4, 0xfde68a)
    this.nose = nose
    return [body, nose]
  }

  private showWalkPose() {
    const sprite = this.playerSprite
    if (!sprite) {
      this.placeNose()
      return
    }

    const key = playerWalkAnimationKey(this.facing)
    const current = sprite.anims.currentAnim
    if (!sprite.anims.isPlaying || current?.key !== key) {
      sprite.play(key)
    }
  }

  private showIdlePose() {
    const sprite = this.playerSprite
    if (!sprite) {
      this.placeNose()
      return
    }

    if (sprite.anims.isPlaying) {
      sprite.anims.stop()
    }
    const idle = playerIdleFrame(this.facing)
    if (Number(sprite.frame.name) !== idle) {
      sprite.setFrame(idle)
    }
  }

  private createTitle() {
    this.title = this.add
      .text(0, 0, 'Pixel Odyssey', {
        fontFamily: 'Consolas, monospace',
        fontSize: '14px',
        color: '#f8fafc',
        backgroundColor: '#14532d',
        padding: { x: 6, y: 4 },
      })
      .setDepth(10000)
  }

  private bindInput() {
    const keyboard = this.input.keyboard
    if (!keyboard) {
      return
    }

    this.cursors = keyboard.createCursorKeys()
    this.wasd = keyboard.addKeys('W,A,S,D') as WasdKeys
    this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.escKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.E,
      Phaser.Input.Keyboard.KeyCodes.ESC,
    ])
    window.addEventListener('blur', this.onBlur)
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  private configureCamera() {
    const camera = this.cameras.main
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    camera.setZoom(CAMERA_ZOOM)
    camera.centerOn(this.player.x, this.player.y)
    camera.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP)
  }

  private pinTitle() {
    const view = this.cameras.main.worldView
    this.title.setPosition(view.x + 8, view.y + 6)
  }

  private canMove() {
    return document.hasFocus() && !document.hidden && this.cursors !== null && this.wasd !== null
  }

  private updateInteraction() {
    const distance = Math.hypot(this.playerX - npc.x, this.playerY - npc.y)
    const inRange = distance <= INTERACT_RADIUS
    this.setPrompt(inRange && !this.dialogueOpen)

    const interactPressed = this.interactKey ? Phaser.Input.Keyboard.JustDown(this.interactKey) : false
    const escPressed = this.escKey ? Phaser.Input.Keyboard.JustDown(this.escKey) : false
    if (escPressed && this.dialogueOpen) {
      this.setDialogue(false)
      return
    }
    if (!interactPressed) {
      return
    }
    if (this.dialogueOpen) {
      this.setDialogue(false)
      return
    }
    if (inRange) {
      this.setDialogue(true)
    }
  }

  private setPrompt(visible: boolean) {
    if (this.promptVisible === visible) {
      return
    }
    this.promptVisible = visible
    this.game.events.emit(VILLAGE_EVENTS.prompt, visible)
  }

  private setDialogue(open: boolean) {
    if (this.dialogueOpen === open) {
      return
    }
    this.dialogueOpen = open
    this.game.events.emit(VILLAGE_EVENTS.dialogue, open)
    if (open) {
      this.setPrompt(false)
    }
  }

  private readMovement() {
    const cursors = this.cursors
    const wasd = this.wasd
    if (!cursors || !wasd) {
      return null
    }

    let rawX = 0
    let rawY = 0
    if (cursors.left.isDown || wasd.A.isDown) rawX -= 1
    if (cursors.right.isDown || wasd.D.isDown) rawX += 1
    if (cursors.up.isDown || wasd.W.isDown) rawY -= 1
    if (cursors.down.isDown || wasd.S.isDown) rawY += 1
    if (rawX === 0 && rawY === 0) {
      return null
    }

    const length = Math.hypot(rawX, rawY)
    return {
      x: rawX / length,
      y: rawY / length,
      facing: facingFrom(rawX, rawY, this.facing),
    }
  }

  private placeNose() {
    if (!this.nose) {
      return
    }
    const spot = NOSE_OFFSET[this.facing]
    this.nose.setPosition(spot.x, spot.y)
  }

  private onPlayerSheetLoaded() {
    this.playerSheetLoaded = true
  }

  private onPlayerSheetError(file: Phaser.Loader.File) {
    if (file.key !== PLAYER_SHEET_KEY) {
      return
    }
    this.playerSheetFailed = true
    console.error(playerSheetFailureMessage(`Player sprite sheet failed to load (${file.src}).`))
  }

  private readonly onBlur = () => {
    this.input.keyboard?.resetKeys()
  }

  private readonly onVisibility = () => {
    if (document.hidden) {
      this.input.keyboard?.resetKeys()
    }
  }

  private readonly onDialogueCloseRequest = () => {
    this.setDialogue(false)
  }

  private shutdown() {
    this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, this.onPlayerSheetError, this)
    this.game.events.off(VILLAGE_EVENTS.closeDialogue, this.onDialogueCloseRequest, this)
    window.removeEventListener('blur', this.onBlur)
    document.removeEventListener('visibilitychange', this.onVisibility)
  }
}

function facingFrom(rawX: number, rawY: number, previous: Facing): Facing {
  if (rawX !== 0 && rawY === 0) {
    return rawX > 0 ? 'right' : 'left'
  }
  if (rawY !== 0 && rawX === 0) {
    return rawY > 0 ? 'down' : 'up'
  }

  const horizontal: Facing = rawX > 0 ? 'right' : 'left'
  const vertical: Facing = rawY > 0 ? 'down' : 'up'
  return previous === vertical ? vertical : horizontal
}
