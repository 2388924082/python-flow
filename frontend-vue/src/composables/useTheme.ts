import { ref, watch } from 'vue'

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

const currentTheme = ref<ThemeName>('vscode-dark')

const loadTheme = (themeName: ThemeName) => {
  const linkId = 'theme-stylesheet'
  let link = document.getElementById(linkId) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  link.href = `/src/styles/themes/${themeName}.theme.css`
  currentTheme.value = themeName
  localStorage.setItem('theme', themeName)
}

const savedTheme = localStorage.getItem('theme') as ThemeName | null
if (savedTheme && themes.some(t => t.name === savedTheme)) {
  currentTheme.value = savedTheme
}
loadTheme(currentTheme.value)

export function useTheme() {
  const setTheme = (themeName: ThemeName) => {
    loadTheme(themeName)
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
