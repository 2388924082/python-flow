import { ref, type Ref } from 'vue'
import type { ExecutionState } from '../types/api'
import { getExecutionStatus } from '../services/api'

export interface UseExecutionOptions {
  onLog?: (log: { timestamp: string; level: string; message: string; nodeId: string | null }) => void
  onStateChange?: (state: ExecutionState) => void
}

export interface UseExecutionReturn {
  executionState: Ref<ExecutionState | null>
  isPolling: Ref<boolean>
  startPolling: (taskId: string) => void
  stopPolling: () => void
}

export function useExecution(options: UseExecutionOptions = {}): UseExecutionReturn {
  const executionState = ref<ExecutionState | null>(null)
  const isPolling = ref(false)
  let pollingInterval: ReturnType<typeof setInterval> | null = null

  const startPolling = (taskId: string) => {
    if (isPolling.value) {
      stopPolling()
    }
    isPolling.value = true
    executionState.value = {
      status: 'running',
      taskId,
      progress: { current: 0, total: 0, currentNode: null },
      logs: [],
      result: null,
      error: null,
      failedNode: null
    }

    pollingInterval = setInterval(async () => {
      try {
        const state = await getExecutionStatus(taskId)
        executionState.value = state
        options.onStateChange?.(state)

        if (state.logs) {
          state.logs.forEach(log => {
            options.onLog?.({
              timestamp: log.timestamp || new Date().toISOString(),
              level: log.level,
              message: log.message,
              nodeId: log.nodeId || null
            })
          })
        }

        if (state.status === 'done' || state.status === 'failed') {
          stopPolling()
        }
      } catch (e) {
        console.error('Polling error:', e)
        stopPolling()
      }
    }, 1000)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    isPolling.value = false
  }

  return {
    executionState,
    isPolling,
    startPolling,
    stopPolling
  }
}
