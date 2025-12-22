import { QuestionTypeEnum, type QuestionType } from '@/types/questionBanks'

// 英文存储 key -> 数值枚举
const keyToEnumMap: Record<string, QuestionType> = {
  single: QuestionTypeEnum.SingleChoice,
  multiple: QuestionTypeEnum.MultipleChoice,
  judge: QuestionTypeEnum.TrueFalse,
  fill: QuestionTypeEnum.FillBlank,
  short: QuestionTypeEnum.ShortAnswer,
}

// 数值枚举 -> 英文存储 key
const enumToKeyMap: Record<QuestionType, string> = {
  [QuestionTypeEnum.SingleChoice]: 'single',
  [QuestionTypeEnum.MultipleChoice]: 'multiple',
  [QuestionTypeEnum.TrueFalse]: 'judge',
  [QuestionTypeEnum.FillBlank]: 'fill',
  [QuestionTypeEnum.ShortAnswer]: 'short',
}

export const typeToKey = (type: QuestionType | string): string => {
  if (typeof type === 'number') {
    return enumToKeyMap[type] ?? String(type)
  }
  return enumToKeyMap[keyToEnumMap[type]] ?? type.toLowerCase().replace(/\s+/g, '_')
}

export const keyToType = (key: string): QuestionType => {
  return keyToEnumMap[key] ?? QuestionTypeEnum.SingleChoice
}

export const isKnownType = (type: QuestionType | string): boolean => {
  if (typeof type === 'number') return type in enumToKeyMap
  return type in keyToEnumMap
}
