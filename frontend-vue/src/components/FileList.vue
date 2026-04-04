<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  workflowList: string[]
  activeWorkflow: string | null
}>()

const emit = defineEmits<{
  select: [name: string]
  refresh: []
}>()

const isCollapsed = ref(false)
</script>

<template>
  <div class="file-list" :class="{ collapsed: isCollapsed }">
    <div class="file-list-header">
      <span v-if="!isCollapsed">文件列表</span>
      <button class="collapse-btn" @click="isCollapsed = !isCollapsed">
        {{ isCollapsed ? '▶' : '◀' }}
      </button>
    </div>
    <div class="file-list-content" v-if="!isCollapsed">
      <div
        v-for="name in workflowList"
        :key="name"
        class="file-item"
        :class="{ active: name === activeWorkflow }"
        @click="emit('select', name)"
      >
        📄 {{ name }}
      </div>
      <div v-if="workflowList.length === 0" class="empty-message">
        暂无工作流
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-list {
  width: 200px;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  transition: width var(--transition-normal);
}

.file-list.collapsed {
  width: 40px;
}

.file-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  font-weight: 500;
  font-size: 13px;
  color: var(--text-secondary);
}

.collapsed .file-list-header {
  justify-content: center;
  padding: var(--spacing-sm);
}

.collapse-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--bg-tertiary);
}

.file-list-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-xs);
}

.file-item {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background var(--transition-fast);
}

.file-item:hover {
  background: var(--bg-tertiary);
}

.file-item.active {
  background: var(--accent-color);
  color: white;
}

.empty-message {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
