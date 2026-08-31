import { useDark, useToggle } from '@vueuse/core'
import { watchEffect } from 'vue'
import { useConfigStore } from '@/stores/config-store'
import { DEFAULT_THEME, getTheme } from '@/lib/themes'

export function useTheme() {
  const configStore = useConfigStore()
  const darkMode = useDark()
  const toggleDarkMode = useToggle(darkMode)

  // Dynamic accent hue
  watchEffect(() => {
    document.documentElement.style.setProperty('--theme-hue', String(configStore.themeColor))
  })

  // Premade theme class + forced dark mode
  watchEffect(() => {
    const el = document.documentElement
    // Remove any existing theme class (collect first to avoid mutation during iteration)
    const toRemove = [...el.classList].filter((cls) => cls.startsWith('theme-'))
    toRemove.forEach((cls) => el.classList.remove(cls))

    const theme = getTheme(configStore.themeName)
    if (!theme) {
      configStore.themeName = DEFAULT_THEME
      return
    }
    if (theme.id !== DEFAULT_THEME) {
      el.classList.add(`theme-${theme.id}`)
    }
    if (theme.forcesDarkMode && !darkMode.value) {
      darkMode.value = true
    }
  })

  return { darkMode, toggleDarkMode }
}
