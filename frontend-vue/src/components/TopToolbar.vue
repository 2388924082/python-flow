<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  workflowName: string | null
  workflowList: string[]
}>()

const emit = defineEmits<{
  save: []
  load: [name: string]
  execute: []
  stop: []
  new: []
  toggleFileList: []
}>()

const isDropdownOpen = ref(false)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleLoad = (name: string) => {
  emit('load', name)
  isDropdownOpen.value = false
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <button class="btn btn-primary" @click="emit('new')">新建</button>
      <button class="btn btn-secondary" @click="emit('save')">保存</button>
      <div class="dropdown">
        <button class="btn btn-secondary" :disabled="workflowList.length === 0" @click="toggleDropdown">加载</button>
        <div class="dropdown-menu" v-if="isDropdownOpen && workflowList.length > 0">
          <button
            v-for="name in workflowList"
            :key="name"
            class="dropdown-item"
            @click="handleLoad(name)"
          >
            {{ name }}
          </button>
        </div>
      </div>
    </div>
    <div class="toolbar-center">
      <span class="workflow-name">{{ workflowName || '未命名工作流' }}</span>
    </div>
    <div class="toolbar-right">
      <button class="btn btn-icon" @click="emit('toggleFileList')" title="切换文件列表">📐</button>
      <button class="btn btn-primary" @click="emit('execute')">执行</button>
      <button class="btn btn-secondary" @click="emit('stop')">停止</button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 var(--spacing-md);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.toolbar-center {
  flex: 1;
  text-align: center;
}

.workflow-name {
  font-weight: 500;
  color: var(--text-primary);
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  margin-top: var(--spacing-xs);
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-tertiary);
}

.btn-icon {
  padding: var(--spacing-xs);
  font-size: 16px;
}
</style>
