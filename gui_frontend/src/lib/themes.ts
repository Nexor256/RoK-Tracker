export type ThemeId = 'default' | 'aurora' | 'spectrum' | 'glass' | 'cyberpunk' | 'luxe'

export interface ThemeOption {
  id: ThemeId
  label: string
  icon: string
  swatchStyle: string
  forcesDarkMode?: boolean
}

export const THEMES = [
  {
    id: 'default',
    label: 'Default',
    icon: '🎨',
    swatchStyle:
      'background: linear-gradient(135deg, oklch(0.58 0.28 275), oklch(0.72 0.3 275)); border-radius: 6px;',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    icon: '🌌',
    swatchStyle:
      'background: linear-gradient(135deg, oklch(0.5 0.18 175), oklch(0.45 0.2 290), oklch(0.5 0.15 340)); border-radius: 10px;',
  },
  {
    id: 'spectrum',
    label: 'Spectrum',
    icon: '🌈',
    swatchStyle:
      'background: linear-gradient(135deg, oklch(0.55 0.25 290), oklch(0.65 0.14 185), oklch(0.6 0.15 20), oklch(0.7 0.12 60)); border-radius: 8px;',
  },
  {
    id: 'glass',
    label: 'Glass',
    icon: '✨',
    swatchStyle:
      'background: linear-gradient(135deg, oklch(0.88 0.05 280), oklch(0.9 0.04 330), oklch(0.88 0.05 220)); border-radius: 12px; opacity: 0.9;',
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    icon: '⚡',
    swatchStyle:
      'background: linear-gradient(135deg, oklch(0.1 0.015 280), oklch(0.3 0.15 195)); border: 1px solid oklch(0.6 0.18 195 / 0.5); border-radius: 2px;',
    forcesDarkMode: true,
  },
  {
    id: 'luxe',
    label: 'Luxe',
    icon: '👑',
    swatchStyle:
      'background: linear-gradient(135deg, oklch(0.08 0.01 70), oklch(0.25 0.06 80)); border: 1px solid oklch(0.5 0.08 85 / 0.3); border-radius: 6px;',
    forcesDarkMode: true,
  },
] as const satisfies readonly ThemeOption[]

export const DEFAULT_THEME: ThemeId = 'default'

export const getTheme = (id: string): ThemeOption | undefined =>
  THEMES.find((theme) => theme.id === id)
