<script setup lang="ts">
import { useTheme, themes } from '../composables/useTheme'

const { currentTheme, setTheme } = useTheme()

const cycleTheme = () => {
  const currentIndex = themes.findIndex(t => t.name === currentTheme.value)
  const nextIndex = (currentIndex + 1) % themes.length
  setTheme(themes[nextIndex].name)
}
</script>

<template>
  <div class="theme-switcher" @click="cycleTheme" title="切换主题">
    {{ themes.find(t => t.name === currentTheme)?.icon || '🎨' }}
  </div>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.theme-switcher:hover {
  background: var(--bg-tertiary);
}
</style>
