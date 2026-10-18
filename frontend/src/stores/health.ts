import axios from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HealthStatus {
  status: string
  service: string
  message: string
}

export const useHealthStore = defineStore('health', () => {
  const health = ref<HealthStatus | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function check() {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get<HealthStatus>('/api/health')
      health.value = response.data
    } catch (cause) {
      health.value = null
      error.value = cause instanceof Error ? cause.message : '后端健康检查失败'
    } finally {
      loading.value = false
    }
  }

  return { health, error, loading, check }
})
