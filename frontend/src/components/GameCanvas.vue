<script setup lang="ts">
import Phaser from 'phaser'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createGameConfig, VIEW_HEIGHT, VIEW_WIDTH } from '../game/config'
import { VILLAGE_EVENTS } from '../game/villageMap'

const frame = ref<HTMLDivElement | null>(null)
const host = ref<HTMLDivElement | null>(null)
const promptVisible = ref(false)
const dialogueOpen = ref(false)
let game: Phaser.Game | null = null
let observer: ResizeObserver | null = null

function onPrompt(visible: boolean) {
  promptVisible.value = visible
}

function onDialogue(open: boolean) {
  dialogueOpen.value = open
}

function closeDialogue() {
  game?.events.emit(VILLAGE_EVENTS.closeDialogue)
}

function fitCanvas() {
  if (!game || !frame.value) {
    return
  }

  const fit = Math.min(
    frame.value.clientWidth / VIEW_WIDTH,
    frame.value.clientHeight / VIEW_HEIGHT,
  )
  const nextZoom = fit >= 1 ? Math.floor(fit) : Math.max(fit, 0.25)
  if (Math.abs(game.scale.zoom - nextZoom) > 0.01) {
    game.scale.setZoom(nextZoom)
  }
}

onMounted(() => {
  if (!frame.value || !host.value) {
    return
  }

  game?.destroy(true)
  promptVisible.value = false
  dialogueOpen.value = false
  game = new Phaser.Game(createGameConfig(host.value))
  game.events.on(VILLAGE_EVENTS.prompt, onPrompt)
  game.events.on(VILLAGE_EVENTS.dialogue, onDialogue)
  game.events.once(Phaser.Core.Events.READY, fitCanvas)
  observer = new ResizeObserver(() => {
    fitCanvas()
  })
  observer.observe(frame.value)
  window.addEventListener('resize', fitCanvas)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitCanvas)
  observer?.disconnect()
  observer = null
  game?.events.off(VILLAGE_EVENTS.prompt, onPrompt)
  game?.events.off(VILLAGE_EVENTS.dialogue, onDialogue)
  game?.destroy(true)
  game = null
})
</script>

<template>
  <div ref="frame" class="game-frame">
    <div ref="host" class="game-host"></div>
    <p v-show="promptVisible" class="prompt">按 E 与村民交谈</p>
    <section v-show="dialogueOpen" class="dialogue" role="dialog" aria-labelledby="villager-line">
      <p class="speaker">村民</p>
      <p id="villager-line">欢迎来到晨曦村，冒险者。前方的森林最近出现了奇怪的魔物。</p>
      <button type="button" @click="closeDialogue">关闭</button>
    </section>
  </div>
</template>

<style scoped>
.game-frame {
  position: relative;
  width: 100%;
  height: min(68vh, 600px);
  min-height: 180px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #0e1712;
  border: 1px solid #245c32;
  border-radius: 0.6rem;
}

.prompt,
.dialogue {
  position: absolute;
  left: 50%;
  z-index: 2;
  transform: translateX(-50%);
}

.prompt {
  bottom: 12px;
  margin: 0;
  padding: 0.35rem 0.7rem;
  color: #fef3c7;
  background: #1c1917;
  border: 2px solid #fde68a;
  font-size: 0.95rem;
  pointer-events: none;
}

.dialogue {
  bottom: 16px;
  width: min(28rem, calc(100% - 1.5rem));
  margin: 0;
  padding: 0.8rem 0.9rem;
  color: #fef3c7;
  background: #1c1917;
  border: 3px solid #fde68a;
}

.speaker {
  margin: 0 0 0.35rem;
  color: #fdba74;
  font-size: 0.85rem;
}

.dialogue p {
  margin: 0;
}

.dialogue button {
  margin-top: 0.7rem;
}

.game-host {
  width: 100%;
  height: 100%;
}

.game-host :deep(canvas) {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
</style>
