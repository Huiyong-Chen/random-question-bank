import { type QuestionType, QuestionTypeLabel } from '../types/questionBanks'
import { strings } from '../i18n/strings'

interface RatioSettingsProps {
  currentTypes: QuestionType[]
  ratios: Record<QuestionType, number>
  totalRatio: number
  targetScore: number
  questionCounts: Record<string, number>
  onRatioChange: (type: QuestionType, value: number) => void
  onTargetScoreChange: (value: number) => void
}

export const RatioSettings = ({
  currentTypes,
  ratios,
  totalRatio,
  targetScore,
  questionCounts,
  onRatioChange,
  onTargetScoreChange,
}: RatioSettingsProps) => {
  return (
    <div className="ratio-settings">
      <div className="settings-grid">
        <div className="setting-item">
          <label htmlFor="target-score">{strings.ratio.targetScoreLabel}</label>
          <input
            id="target-score"
            type="number"
            min={1}
            value={targetScore}
            onChange={(e) => onTargetScoreChange(Number(e.target.value))}
            className="number-input"
          />
          <small className="hint-text">
            {strings.ratio.targetScoreHint}
          </small>
        </div>

        <div className="setting-item">
          <label>{strings.ratio.totalRatioLabel}</label>
          <div className="total-ratio-display">{totalRatio}</div>
          <small className="hint-text">{strings.ratio.totalRatioHint}</small>
        </div>
      </div>

      <div className="weight-explanation">
        <h3>{strings.ratio.weightTitle}</h3>
        <div className="explanation-content">
          <p>
            <strong>{strings.ratio.weightRole}</strong>
            {strings.ratio.weightDesc}
          </p>
          <p>
            <strong>示例：</strong>
            {strings.ratio.weightExample}
          </p>
          <ul>
            <li>单选题被抽中的概率 = 30 / (30 + 20 + 50) = 30%</li>
            <li>判断题被抽中的概率 = 20 / (30 + 20 + 50) = 20%</li>
            <li>简答题被抽中的概率 = 50 / (30 + 20 + 50) = 50%</li>
          </ul>
          <p>
            <strong>注意：</strong>
            {strings.ratio.weightNote}
          </p>
        </div>
      </div>

      <div className="ratio-list">
        <h3>{strings.ratio.ratioTitle}</h3>
        {currentTypes.map((type) => (
          <div className="ratio-item" key={type}>
            <div className="ratio-item-info">
              <strong>{QuestionTypeLabel[type]}</strong>
              <span className="question-count">
                {strings.ratio.questionCountPrefix} {questionCounts[type] ?? 0}{' '}
                {strings.ratio.questionCountSuffix}
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={1}
              value={ratios[type] ?? 0}
              onChange={(e) => onRatioChange(type, Number(e.target.value))}
              className="ratio-input"
              placeholder={strings.ratio.ratioPlaceholder}
            />
          </div>
        ))}
      </div>
    </div>
  )
}


