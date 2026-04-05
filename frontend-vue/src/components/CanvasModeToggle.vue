<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  'mode-change': [mode: 'select' | 'pan']
}>()

const currentMode = ref<'select' | 'pan'>('pan')

const setMode = (mode: 'select' | 'pan') => {
  currentMode.value = mode
  emit('mode-change', mode)
}
</script>

<template>
  <div class="mode-toggle">
    <div
      class="mode-btn"
      :class="{ active: currentMode === 'select' }"
      @click="setMode('select')"
      title="框选模式"
    >
      🖱️
    </div>
    <div
      class="mode-btn"
      :class="{ active: currentMode === 'pan' }"
      @click="setMode('pan')"
      title="移动模式"
    >
      ✋
    </div>
  </div>
</template>

<style scoped>
.mode-toggle {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  z-index: 10;
}

.mode-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.mode-btn:hover {
  background: var(--bg-hover);
}

.mode-btn.active {
  background: var(--accent-color);
}
</style>
