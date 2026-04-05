<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PluginDefinition, CategoryDefinition } from '../types/api'

const props = defineProps<{
  plugins: PluginDefinition[]
  categories: CategoryDefinition[]
}>()

const hoveredCategory = ref<string | null>(null)

const onDragStart = (event: DragEvent, plugin: PluginDefinition) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', plugin.id)
    event.dataTransfer.effectAllowed = 'move'
  }
}

const sortedCategories = computed(() => {
  const categoryMap = new Map<string, CategoryDefinition>()
  props.categories.forEach(c => {
    categoryMap.set(c.id, c)
  })
  const result = Array.from(categoryMap.values())
  result.sort((a, b) => a.order - b.order)
  return result
})

const getPluginsByCategory = (categoryId: string) => {
  return props.plugins.filter(p => p.category === categoryId)
}
</script>

<template>
  <div class="floating-toolbar">
    <div
      v-for="category in sortedCategories"
      :key="category.id"
      class="toolbar-category"
      @mouseenter="hoveredCategory = category.id"
      @mouseleave="hoveredCategory = null"
    >
      <div class="category-icon" :title="category.name">
        {{ category.icon }}
      </div>
      <Transition name="fade">
        <div
          v-if="hoveredCategory === category.id"
          class="category-popup"
        >
          <div class="popup-title">{{ category.name }}</div>
          <div class="popup-items">
            <div
              v-for="plugin in getPluginsByCategory(category.id)"
              :key="plugin.id"
              class="popup-item"
              draggable="true"
              @dragstart="onDragStart($event, plugin)"
              :title="plugin.name"
            >
              <span class="plugin-icon">{{ plugin.icon }}</span>
              <span class="plugin-name">{{ plugin.name }}</span>
            </div>
            <div
              v-if="getPluginsByCategory(category.id).length === 0"
              class="popup-empty"
            >
              暂无可用节点
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.floating-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
}

.toolbar-category {
  position: relative;
}

.category-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.category-icon:hover {
  background: var(--bg-hover);
  transform: scale(1.1);
}

.category-popup {
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  min-width: 160px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  padding: var(--spacing-sm);
}

.popup-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-xs);
}

.popup-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 300px;
  overflow-y: auto;
}

.popup-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  cursor: grab;
  transition: background var(--transition-fast);
}

.popup-item:hover {
  background: var(--bg-hover);
}

.popup-item:active {
  cursor: grabbing;
}

.plugin-icon {
  font-size: 14px;
}

.plugin-name {
  font-size: 12px;
  color: var(--text-primary);
}

.popup-empty {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 8px;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-8px);
}
</style>
