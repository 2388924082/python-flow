import { ref } from 'vue'

export type ThemeName = 'vscode-dark' | 'light' | 'dark'

export interface Theme {
  name: ThemeName
  label: string
  icon: string
}

export const themes: Theme[] = [
  { name: 'vscode-dark', label: 'VSCode Dark', icon: '🎨' },
  { name: 'light', label: 'Light', icon: '☀️' },
  { name: 'dark', label: 'GitHub Dark', icon: '🌙' }
]

const currentTheme = ref<ThemeName>('dark')

const applyTheme = (themeName: ThemeName) => {
  document.body.classList.remove('theme-vscode-dark', 'theme-light', 'theme-dark')
  document.body.classList.add(`theme-${themeName}`)
  currentTheme.value = themeName
  localStorage.setItem('theme', themeName)
}

const savedTheme = localStorage.getItem('theme') as ThemeName | null
if (savedTheme && themes.some(t => t.name === savedTheme)) {
  currentTheme.value = savedTheme
}
applyTheme(currentTheme.value)

export function useTheme() {
  const setTheme = (themeName: ThemeName) => {
    applyTheme(themeName)
  }

  const getThemeLabel = (themeName: ThemeName) => {
    return themes.find(t => t.name === themeName)?.label || themeName
  }

  return {
    currentTheme,
    themes,
    setTheme,
    getThemeLabel
  }
}