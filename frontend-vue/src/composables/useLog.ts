import { ref, type Ref } from 'vue'
import type { LogEntry } from '../types/api'

const logLevelMap: Record<string, 'log' | 'info' | 'warn' | 'error'> = {
  debug: 'log',
  info: 'info',
  warn: 'warn',
  error: 'error'
}

export interface UseLogReturn {
  logs: Ref<LogEntry[]>
  addLog: (message: string, level: 'debug' | 'info' | 'warn' | 'error', source?: 'FE' | 'BE') => void
  clearLogs: () => void
}

export function useLog(): UseLogReturn {
  const logs = ref<LogEntry[]>([])

  const addLog = (message: string, level: 'debug' | 'info' | 'warn' | 'error', source: 'FE' | 'BE' = 'FE') => {
    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      source,
      level,
      message,
      nodeId: null
    }
    logs.value.push(entry)

    const consoleMethod = logLevelMap[level.toLowerCase() as keyof typeof logLevelMap]
    if (consoleMethod) {
      console[consoleMethod](`[${source}] ${message}`)
    }
  }

  const clearLogs = () => {
    logs.value = []
  }

  return {
    logs,
    addLog,
    clearLogs
  }
}
