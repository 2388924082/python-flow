<script setup lang="ts">
import { ref, computed } from 'vue'

interface MenuItem {
  label: string
  icon?: string
  action?: () => void
  danger?: boolean
  type?: 'item' | 'separator' | 'category'
  children?: MenuItem[]
}

interface Props {
  items: MenuItem[]
  mode?: 'normal' | 'scroll'
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'normal',
  depth: 0
})

const emit = defineEmits<{
  close: []
  'item-click': [item: MenuItem]
}>()

const menuRef = ref<HTMLElement>()

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as HTMLElement)) {
    emit('close')
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

function handleItemClick(item: MenuItem) {
  if (!item.children || props.mode === 'scroll') {
    emit('item-click', item)
  }
}

const flattenedItems = computed(() => {
  if (!(props.mode === 'scroll' && props.depth >= 1)) return []

  const result: { item: MenuItem; showSeparator: boolean }[] = []

  for (let i = 0; i < props.items.length; i++) {
    const category = props.items[i]
    result.push({ item: { ...category, type: 'category' as any }, showSeparator: false })

    if (category.children) {
      for (const child of category.children) {
        result.push({ item: child, showSeparator: false })
      }
    }

    if (i < props.items.length - 1) {
      result.push({ item: { label: '', type: 'separator' as any }, showSeparator: false })
    }
  }

  return result
})

import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div ref="menuRef" class="context-menu" :class="{ 'scroll-mode': mode === 'scroll' && depth >= 1 }">
    <template v-if="mode === 'scroll' && depth >= 1">
      <template v-for="({ item }, index) in flattenedItems" :key="index">
        <div v-if="item.type === 'separator'" class="menu-separator">
          <span class="separator-line"></span>
          <span class="separator-text">{{ index === 1 ? '' : index === flattenedItems.length - 2 ? '' : '' }}</span>
          <span class="separator-line"></span>
        </div>
        <div v-else-if="item.type === 'category'" class="menu-category">
          <span v-if="item.icon" class="item-icon">{{ item.icon }}</span>
          <span class="item-label">{{ item.label }}</span>
        </div>
        <div v-else class="menu-item">
          <div
            class="menu-item-content"
            :class="{ danger: item.danger }"
            @click="handleItemClick(item)"
          >
            <span v-if="item.icon" class="item-icon">{{ item.icon }}</span>
            <span class="item-label">{{ item.label }}</span>
          </div>
        </div>
      </template>
    </template>
    <template v-else>
      <div
        v-for="(item, index) in items"
        :key="index"
        class="menu-item"
        :class="{ 'has-children': item.children && item.children.length > 0 }"
      >
        <div
          class="menu-item-content"
          :class="{ danger: item.danger }"
          @click="handleItemClick(item)"
        >
          <span v-if="item.icon" class="item-icon">{{ item.icon }}</span>
          <span class="item-label">{{ item.label }}</span>
          <span v-if="item.children && item.children.length > 0 && !(mode === 'scroll' && depth >= 1)" class="submenu-arrow">▶</span>
        </div>
        <div v-if="item.children && item.children.length > 0 && !(mode === 'scroll' && depth >= 1)" class="submenu">
          <ContextMenu
            :items="item.children"
            :mode="mode"
            :depth="depth + 1"
            @item-click="$emit('item-click', $event)"
            @close="$emit('close')"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.context-menu {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 140px;
}

.context-menu.scroll-mode {
  max-height: 300px;
  overflow-y: auto;
}

.menu-separator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
}

.separator-line {
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.menu-category {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-item {
  position: relative;
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
  white-space: nowrap;
}

.menu-item-content:hover {
  background: var(--bg-hover);
}

.menu-item-content.danger {
  color: var(--error-color);
}

.menu-item-content.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}

.item-icon {
  font-size: 14px;
}

.item-label {
  flex: 1;
}

.submenu-arrow {
  font-size: 10px;
  color: var(--text-secondary);
}

.submenu {
  display: none;
  position: absolute;
  left: 100%;
  top: -6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 140px;
}

.menu-item:hover > .submenu {
  display: block;
}
</style>
