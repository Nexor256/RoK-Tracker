/** Kill-point math aligned with roktracker/kingdom/types/governor_data.py validate_kills */

export type TroopTier = 1 | 2 | 3 | 4 | 5

export const KILL_TIER_LABELS = ['T1', 'T2', 'T3', 'T4', 'T5'] as const

/** Human-readable multiplier hint per tier */
export const KILL_POINT_HINTS: Record<TroopTier, string> = {
  1: 'floor(kills × 0.2)',
  2: 'kills × 2',
  3: 'kills × 4',
  4: 'kills × 10',
  5: 'kills × 20',
}

export function computeTierKillPoints(tier: TroopTier, kills: number): number {
  const k = kills || 0
  switch (tier) {
    case 1:
      return Math.floor(k * 0.2)
    case 2:
      return k * 2
    case 3:
      return k * 4
    case 4:
      return k * 10
    case 5:
      return k * 20
  }
}

export function computeTotalKillPoints(killsByTier: readonly number[]): number {
  return killsByTier.reduce(
    (sum, kills, i) => sum + computeTierKillPoints((i + 1) as TroopTier, kills),
    0,
  )
}

export function fmt(n: number): string {
  if (!n || Number.isNaN(n)) return '0'
  return n.toLocaleString('en-US')
}

export function formatDuration(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0m'
  const d = Math.floor(totalMinutes / 1440)
  const h = Math.floor((totalMinutes % 1440) / 60)
  const m = Math.round(totalMinutes % 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || parts.length === 0) parts.push(`${m}m`)
  return parts.join(' ')
}

// ─── Troop Training ───

export interface TroopTrainingTier {
  tier: TroopTier
  name: string
  baseTime: number
  power: number
  food: number
  wood: number
  stone: number
  gold: number
}

export const TROOP_TRAINING_TIERS: TroopTrainingTier[] = [
  { tier: 1, name: 'Tier 1', baseTime: 0.5, power: 2, food: 50, wood: 50, stone: 0, gold: 0 },
  { tier: 2, name: 'Tier 2', baseTime: 1, power: 8, food: 100, wood: 100, stone: 50, gold: 0 },
  { tier: 3, name: 'Tier 3', baseTime: 2, power: 24, food: 200, wood: 200, stone: 150, gold: 50 },
  { tier: 4, name: 'Tier 4', baseTime: 3, power: 60, food: 500, wood: 500, stone: 300, gold: 100 },
  { tier: 5, name: 'Tier 5', baseTime: 6, power: 100, food: 1000, wood: 1000, stone: 600, gold: 200 },
]

export interface TrainingInput {
  tier: TroopTier
  count: number
  batchSize: number
  speedBonus: number
}

export interface TrainingResult {
  batches: number
  perBatchMin: number
  totalMin: number
  power: number
  food: number
  wood: number
  stone: number
  gold: number
}

export function computeTrainingResult(input: TrainingInput): TrainingResult {
  const tier =
    TROOP_TRAINING_TIERS.find((t) => t.tier === input.tier) ?? TROOP_TRAINING_TIERS[3]
  const count = input.count || 0
  const batch = input.batchSize || 1
  const bonus = 1 + (input.speedBonus || 0) / 100
  const batches = Math.ceil(count / batch)
  const perBatchMin = (tier.baseTime * batch) / bonus
  const totalMin = perBatchMin * batches
  return {
    batches,
    perBatchMin,
    totalMin,
    power: count * tier.power,
    food: count * tier.food,
    wood: count * tier.wood,
    stone: count * tier.stone,
    gold: count * tier.gold,
  }
}

export function formatTrainingSummary(input: TrainingInput, result: TrainingResult): string {
  const tier = TROOP_TRAINING_TIERS.find((t) => t.tier === input.tier)
  return [
    `Troop Training — ${tier?.name ?? 'Tier ' + input.tier}`,
    `Troops: ${fmt(input.count)} | Batches: ${result.batches}`,
    `Time: ${formatDuration(result.totalMin)} (${formatDuration(result.perBatchMin)}/batch)`,
    `Power: ${fmt(result.power)}`,
    `Food: ${fmt(result.food)} | Wood: ${fmt(result.wood)} | Stone: ${fmt(result.stone)} | Gold: ${fmt(result.gold)}`,
  ].join('\n')
}

// ─── Healing ───

export interface HealTierDef {
  label: string
  foodPer: number
  woodPer: number
  stonePer: number
  goldPer: number
  timePer: number
}

export const HEAL_TIER_DEFS: HealTierDef[] = [
  { label: 'T1', foodPer: 25, woodPer: 15, stonePer: 0, goldPer: 0, timePer: 0.1 },
  { label: 'T2', foodPer: 50, woodPer: 30, stonePer: 15, goldPer: 0, timePer: 0.2 },
  { label: 'T3', foodPer: 100, woodPer: 60, stonePer: 40, goldPer: 15, timePer: 0.5 },
  { label: 'T4', foodPer: 200, woodPer: 120, stonePer: 80, goldPer: 30, timePer: 1.0 },
  { label: 'T5', foodPer: 400, woodPer: 250, stonePer: 160, goldPer: 60, timePer: 2.0 },
]

export const ALLIANCE_HELP_FLOOR_MIN = 3

export interface HealTierBreakdown {
  label: string
  count: number
  food: number
  wood: number
  stone: number
  gold: number
  timeMin: number
}

export interface HealInput {
  countsByTier: readonly number[]
  speedBonus: number
  hospitalCapacity: number
  allianceHelps: number
}

export interface HealResult {
  food: number
  wood: number
  stone: number
  gold: number
  totalTroops: number
  baseMin: number
  savedMin: number
  totalMin: number
  batches: number
  exceedsHospitalCapacity: boolean
  firstTapMin: number
  firstTapRule: '1% rule' | 'floor rule'
  tapsToFinish: number
  tierBreakdown: HealTierBreakdown[]
}

export function simulateAllianceHelps(startMin: number, taps: number, floor: number) {
  let remaining = startMin
  let totalSaved = 0
  for (let i = 0; i < taps && remaining > 0; i++) {
    const onePercent = remaining * 0.01
    const reduction = Math.max(onePercent, floor)
    const actual = Math.min(reduction, remaining)
    remaining -= actual
    totalSaved += actual
  }
  return { remaining, totalSaved }
}

export function tapsToFinish(startMin: number, floor: number): number {
  if (startMin <= 0) return 0
  let remaining = startMin
  let taps = 0
  const maxIter = 100_000
  while (remaining > 0.01 && taps < maxIter) {
    const reduction = Math.max(remaining * 0.01, floor)
    remaining -= Math.min(reduction, remaining)
    taps++
  }
  return taps >= maxIter ? Infinity : taps
}

export function computeHealResult(input: HealInput): HealResult {
  const bonus = 1 + (input.speedBonus || 0) / 100
  const floor = ALLIANCE_HELP_FLOOR_MIN
  const taps = input.allianceHelps || 0
  const cap = input.hospitalCapacity || 1

  let food = 0
  let wood = 0
  let stone = 0
  let gold = 0
  let totalTroops = 0
  let rawMinutes = 0
  const tierBreakdown: HealTierBreakdown[] = []

  for (let i = 0; i < HEAL_TIER_DEFS.length; i++) {
    const def = HEAL_TIER_DEFS[i]
    const c = input.countsByTier[i] || 0
    totalTroops += c
    const tierFood = c * def.foodPer
    const tierWood = c * def.woodPer
    const tierStone = c * def.stonePer
    const tierGold = c * def.goldPer
    const tierTime = (c * def.timePer) / bonus
    food += tierFood
    wood += tierWood
    stone += tierStone
    gold += tierGold
    rawMinutes += c * def.timePer
    tierBreakdown.push({
      label: def.label,
      count: c,
      food: tierFood,
      wood: tierWood,
      stone: tierStone,
      gold: tierGold,
      timeMin: tierTime,
    })
  }

  const baseMin = rawMinutes / bonus
  const onePercent = baseMin * 0.01
  const firstTapMin = baseMin > 0 ? Math.max(onePercent, floor) : 0
  const firstTapRule: HealResult['firstTapRule'] = onePercent >= floor ? '1% rule' : 'floor rule'
  const { remaining: totalMin, totalSaved: savedMin } = simulateAllianceHelps(baseMin, taps, floor)
  const batches = Math.ceil(totalTroops / cap)
  const ttf = baseMin > 0 ? tapsToFinish(baseMin, floor) : 0

  return {
    food,
    wood,
    stone,
    gold,
    totalTroops,
    baseMin,
    savedMin,
    totalMin,
    batches,
    exceedsHospitalCapacity: totalTroops > cap,
    firstTapMin,
    firstTapRule,
    tapsToFinish: ttf,
    tierBreakdown,
  }
}

export function formatKillPointsSummary(
  killsByTier: readonly number[],
  compareKp?: number | null,
): string {
  const lines = KILL_TIER_LABELS.map((label, i) => {
    const kills = killsByTier[i] || 0
    const kp = computeTierKillPoints((i + 1) as TroopTier, kills)
    return `${label}: ${fmt(kills)} kills → ${fmt(kp)} KP`
  })
  const total = computeTotalKillPoints(killsByTier)
  lines.push(`Total: ${fmt(total)} KP`)
  if (compareKp != null && !Number.isNaN(compareKp)) {
    const delta = compareKp - total
    lines.push(`Compare: ${fmt(compareKp)} KP (Δ ${delta >= 0 ? '+' : ''}${fmt(delta)})`)
  }
  return lines.join('\n')
}

export function formatHealSummary(input: HealInput, result: HealResult): string {
  const lines = [
    'Healing Cost',
    `Food: ${fmt(result.food)} | Wood: ${fmt(result.wood)} | Stone: ${fmt(result.stone)} | Gold: ${fmt(result.gold)}`,
    `Wounded: ${fmt(result.totalTroops)} | Base time: ${formatDuration(result.baseMin)} | After helps: ${formatDuration(result.totalMin)}`,
    `Hospital batches: ${result.batches}${result.exceedsHospitalCapacity ? ' (informational only)' : ''}`,
  ]
  for (const t of result.tierBreakdown) {
    if (t.count > 0) {
      lines.push(
        `${t.label}: ${fmt(t.count)} — F ${fmt(t.food)} W ${fmt(t.wood)} S ${fmt(t.stone)} G ${fmt(t.gold)} | ${formatDuration(t.timeMin)}`,
      )
    }
  }
  return lines.join('\n')
}

// ─── Persistence ───

export const CALCULATOR_STORAGE_KEY = 'rok-calculator-state'

export interface CalculatorPersistedState {
  activeTab: string
  killKills: number[]
  compareKp?: number | null
  training: TrainingInput
  healCounts: number[]
  healSpeedBonus: number
  hospitalCapacity: number
  allianceHelps: number
}

export function loadCalculatorState(): Partial<CalculatorPersistedState> | null {
  try {
    const raw = localStorage.getItem(CALCULATOR_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<CalculatorPersistedState>
  } catch {
    return null
  }
}

export function saveCalculatorState(state: CalculatorPersistedState): void {
  try {
    localStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota / private mode
  }
}
