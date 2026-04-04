<script setup lang="ts">
import { ref } from 'vue'

const levels = ['debug', 'info', 'warn', 'error']

interface LogEntry {
  id: string
  timestamp: string
  source: 'FE' | 'BE'
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  nodeId: string | null
}

defineProps<{
  logs: LogEntry[]
}>()

const emit = defineEmits<{
  clear: []
}>()

const filterLevel = ref<string | null>(null)

const filteredLogs = (logs: LogEntry[]) => {
  if (!filterLevel.value) return logs
  return logs.filter(log => log.level === filterLevel.value)
}

const getLevelClass = (level: string) => `log-${level}`

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'debug': return '🔍'
    case 'info': return 'ℹ️'
    case 'warn': return '⚠️'
    case 'error': return '❌'
    default: return '📝'
  }
}
</script>

<template>
  <div class="bottom-panel">
    <div class="panel-header">
      <span class="panel-title">日志</span>
      <div class="panel-actions">
        <select v-model="filterLevel" class="filter-select">
          <option :value="null">全部</option>
          <option v-for="level in levels" :key="level" :value="level">
            {{ level.toUpperCase() }}
          </option>
        </select>
        <button class="btn-clear" @click="emit('clear')">清空</button>
      </div>
    </div>
    <div class="log-list">
      <div
        v-for="log in filteredLogs(logs)"
        :key="log.id"
        class="log-entry"
        :class="getLevelClass(log.level)"
      >
        <span class="log-time">{{ log.timestamp }}</span>
        <span class="log-source">{{ log.source }}</span>
        <span class="log-icon">{{ getLevelIcon(log.level) }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
      <div v-if="logs.length === 0" class="empty-logs">
        暂无日志
      </div>
    </div>
  </div>
</template>

<style scoped>
.bottom-panel {
  height: 150px;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-weight: 500;
  font-size: 13px;
  color: var(--text-secondary);
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-select {
  padding: 2px var(--spacing-xs);
  font-size: 12px;
}

.btn-clear {
  padding: 2px var(--spacing-sm);
  font-size: 12px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.btn-clear:hover {
  background: var(--bg-tertiary);
}

.log-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs);
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--font-mono);
}

.log-entry:hover {
  background: var(--bg-tertiary);
}

.log-time {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.log-source {
  color: var(--accent-color);
  flex-shrink: 0;
  font-size: 10px;
}

.log-icon {
  flex-shrink: 0;
}

.log-message {
  flex: 1;
  word-break: break-all;
}

.log-debug .log-icon { opacity: 0.5; }
.log-warn { background: rgba(255, 152, 0, 0.1); }
.log-error { background: rgba(244, 67, 54, 0.1); }

.empty-logs {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--text-secondary);
}
</style>
