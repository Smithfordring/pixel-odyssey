<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import GameCanvas from '../components/GameCanvas.vue'
import { useHealthStore } from '../stores/health'

const healthStore = useHealthStore()
const { health, error, loading } = storeToRefs(healthStore)

onMounted(() => {
  void healthStore.check()
})
</script>

<template>
  <main>
    <header class="status-bar">
      <div>
        <p class="eyebrow">Pixel Odyssey</p>
        <h1>启动检查</h1>
      </div>
      <div class="status-actions">
        <button type="button" :disabled="loading" @click="healthStore.check()">
          {{ loading ? '检查中…' : '重新检查' }}
        </button>
        <p v-if="health" class="ok" role="status">
          服务正常：{{ health.status }} — {{ health.message }}
        </p>
        <p v-else-if="error" class="bad" role="alert">后端未响应：{{ error }}</p>
      </div>
    </header>
    <GameCanvas />
    <p class="hint">方向键或 WASD 移动。靠近村民后按 E 交谈，再次按 E、Esc 或关闭按钮结束对话。</p>
    <p class="lead">
      前端开发服务器会把 <code>/api</code> 转发到
      <code>http://localhost:8080</code>。下面的结果来自后端
      <code>GET /api/health</code>。
    </p>
    <pre v-if="health">{{ JSON.stringify(health, null, 2) }}</pre>
  </main>
</template>
