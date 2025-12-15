export const QuestionTypeEnum = {
  SingleChoice: 1,
  MultipleChoice: 2,
  TrueFalse: 3,
  FillBlank: 4,
  ShortAnswer: 5,
} as const

export type QuestionType = (typeof QuestionTypeEnum)[keyof typeof QuestionTypeEnum]

export const QuestionTypeLabel: Record<QuestionType, string> = {
  [QuestionTypeEnum.SingleChoice]: '单选题',
  [QuestionTypeEnum.MultipleChoice]: '多选题',
  [QuestionTypeEnum.TrueFalse]: '判断题',
  [QuestionTypeEnum.FillBlank]: '填空题',
  [QuestionTypeEnum.ShortAnswer]: '简答题',
}

export const QuestionTypeOrder: QuestionType[] = [
  QuestionTypeEnum.SingleChoice,
  QuestionTypeEnum.MultipleChoice,
  QuestionTypeEnum.TrueFalse,
  QuestionTypeEnum.FillBlank,
  QuestionTypeEnum.ShortAnswer,
]

export const getQuestionTypeLabel = (type: QuestionType): string =>
  QuestionTypeLabel[type] ?? ''

export type Question = {
  id: string
  type: QuestionType
  title: string
  options?: string[]
  answer: string
  score: number
  difficulty: number
}

export type QuestionByType = Record<QuestionType, Question[]>
export type QuestionBanks = Record<string, QuestionByType>


