<script setup lang="ts">
import { ref, inject } from 'vue'

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
  toggleCollapse: []
}>()

const toast = inject<any>('toast')

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

const copyLogs = async (logs: LogEntry[]) => {
  const text = filteredLogs(logs).map(log =>
    `${log.timestamp} ${log.source} ${log.level.toUpperCase()} ${log.message}`
  ).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    toast?.success('复制成功')
  } catch (e) {
    toast?.error('复制失败')
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
        <button class="btn-clear" @click="copyLogs(logs)">复制</button>
        <button class="btn-clear" @click="emit('clear')">清空</button>
        <button class="collapse-btn" @click="emit('toggleCollapse')">▼</button>
      </div>
    </div>
    <div class="log-list">
      <div
        v-for="log in filteredLogs(logs)"
        :key="log.id"
        class="log-entry"
        :class="getLevelClass(log.level)"
      >{{ log.timestamp }} {{ log.source }} {{ getLevelIcon(log.level) }} {{ log.message }}</div>
      <div v-if="logs.length === 0" class="empty-logs">
        暂无日志
      </div>
    </div>
  </div>
</template>

<style scoped>
.bottom-panel {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-weight: 500;
  flex: 1;
}

.collapse-btn {
  padding: 2px 6px;
  font-size: 10px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.collapse-btn:hover {
  background: var(--bg-tertiary);
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
  user-select: text;
  -webkit-user-select: text;
}

.log-entry {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: text;
  -webkit-user-select: text;
}

.log-entry:hover {
  background: var(--bg-tertiary);
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
