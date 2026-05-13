/**
 * Shared formatting utilities used across scanner components.
 */

/**
 * Format a number with locale-aware thousand separators.
 * Returns the original string if the value is not a valid number.
 */
export const formatNumber = (value: number | string): string => {
  return isNaN(Number(value)) ? (value as string) : Intl.NumberFormat().format(value as number)
}

/**
 * Format a number in compact notation (e.g. 1.2K, 3.5M, 1.0B).
 * Numbers below 1000 are returned with regular formatting.
 */
export const formatCompactNumber = (value: number | string): string => {
  const num = Number(value)
  if (isNaN(num)) return value as string
  if (Math.abs(num) < 1000) return Intl.NumberFormat().format(num)
  if (Math.abs(num) < 1_000_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  if (Math.abs(num) < 1_000_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
}

/**
 * Format a duration in seconds to a human-readable string.
 * Examples: "2h 15m", "3m 42s", "17s"
 */
export const formatDuration = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.floor(totalSeconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
