import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { RatioSettings } from './RatioSettings'
import { QuestionTypeEnum, type QuestionType } from '@/types/questionBanks'

const meta: Meta<typeof RatioSettings> = {
  title: 'Components/RatioSettings',
  component: RatioSettings,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof RatioSettings>

const defaultCurrentTypes: QuestionType[] = [
  QuestionTypeEnum.SingleChoice,
  QuestionTypeEnum.TrueFalse,
  QuestionTypeEnum.ShortAnswer,
]

const defaultRatios: Record<QuestionType, number> = {
  [QuestionTypeEnum.SingleChoice]: 30,
  [QuestionTypeEnum.MultipleChoice]: 0,
  [QuestionTypeEnum.TrueFalse]: 20,
  [QuestionTypeEnum.FillBlank]: 0,
  [QuestionTypeEnum.ShortAnswer]: 50,
}

const defaultQuestionCounts: Record<string, number> = {
  [QuestionTypeEnum.SingleChoice]: 50,
  [QuestionTypeEnum.TrueFalse]: 30,
  [QuestionTypeEnum.ShortAnswer]: 20,
}

export const Default: Story = {
  args: {
    currentTypes: defaultCurrentTypes,
    ratios: defaultRatios,
    totalRatio: 100,
    targetScore: 100,
    questionCounts: defaultQuestionCounts,
    onRatioChange: fn(),
    onTargetScoreChange: fn(),
  },
}

export const EmptyRatios: Story = {
  args: {
    currentTypes: defaultCurrentTypes,
    ratios: {
      [QuestionTypeEnum.SingleChoice]: 0,
      [QuestionTypeEnum.MultipleChoice]: 0,
      [QuestionTypeEnum.TrueFalse]: 0,
      [QuestionTypeEnum.FillBlank]: 0,
      [QuestionTypeEnum.ShortAnswer]: 0,
    },
    totalRatio: 0,
    targetScore: 100,
    questionCounts: defaultQuestionCounts,
    onRatioChange: fn(),
    onTargetScoreChange: fn(),
  },
}

