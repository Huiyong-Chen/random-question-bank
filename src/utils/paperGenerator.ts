import { type Question, type QuestionType } from '@/types/questionBanks'

export type RatioMap = Record<QuestionType, number>

export type GeneratedPaper = {
  list: Question[]
  totalScore: number
  shortfall?: number
}

const randomPick = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)]

const buildWeightedPicker = (ratios: RatioMap) => {
  const entries = (Object.entries(ratios) as unknown as [QuestionType, number][]).filter(
    ([, weight]) => weight > 0,
  )
  const totalWeight = entries.reduce((acc, [, weight]) => acc + weight, 0)

  return (): QuestionType | null => {
    if (entries.length === 0 || totalWeight <= 0) return null
    let roll = Math.random() * totalWeight
    for (const [type, weight] of entries) {
      roll -= weight
      if (roll <= 0) return type
    }
    return entries.at(-1)?.[0] ?? null
  }
}

export const generatePaper = (
  bank: Record<QuestionType, Question[]>,
  ratioInput: RatioMap,
  targetScore: number,
): GeneratedPaper => {
  if (!bank) return { list: [], totalScore: 0 }

  const ratios = Object.fromEntries(
    (Object.keys(bank) as unknown as QuestionType[]).map((type) => [type, ratioInput[type] ?? 0]),
  ) as RatioMap

  const picker = buildWeightedPicker(ratios)
  const available = Object.fromEntries(
    (Object.entries(bank) as unknown as [QuestionType, Question[]][]).map(([type, list]) => [type, [...list]]),
  ) as Record<QuestionType, Question[]>

  const result: Question[] = []
  let total = 0

  while (total < targetScore) {
    const type = picker()
    if (!type) break
    const pool = available[type]
    if (!pool || pool.length === 0) {
      ratios[type] = 0
      continue
    }

    const chosen = randomPick(pool)
    result.push(chosen)
    total += chosen.score
    available[type] = pool.filter((q) => q.id !== chosen.id)

    if (Object.values(available).every((list) => list.length === 0)) break
  }

  return {
    list: result,
    totalScore: total,
    shortfall: Math.max(targetScore - total, 0) || undefined,
  }
}

