import { type Question, QuestionTypeLabel } from '../types/questionBanks'
import { type GeneratedPaper } from '../utils/paperGenerator'
import { strings } from '../i18n/strings'

interface PaperPreviewProps {
  paper: GeneratedPaper | null
  onExport: () => void
}

const questionTitle = (q: Question, index: number) =>
  `${index + 1}. [${QuestionTypeLabel[q.type]}] ${q.title} (${q.score}分)`

export const PaperPreview = ({ paper, onExport }: PaperPreviewProps) => {
  if (!paper || paper.list.length === 0) {
    return (
      <div className="paper-preview">
        <div className="empty-state">
          <p>{strings.paperPreview.empty}</p>
          <p className="empty-hint">{strings.paperPreview.emptyHint}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="paper-preview">
      <div className="paper-summary">
        <div className="summary-item">
          <span className="summary-label">{strings.paperPreview.questionCountLabel}</span>
          <span className="summary-value">{paper.list.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">{strings.paperPreview.totalScoreLabel}</span>
          <span className="summary-value">{paper.totalScore}</span>
        </div>
        {paper.shortfall ? (
          <div className="summary-item warn">
            <span className="summary-label">{strings.paperPreview.shortfallLabel}</span>
            <span className="summary-value">
              {strings.paperPreview.shortfallTextPrefix} {paper.shortfall} 分
            </span>
          </div>
        ) : (
          <div className="summary-item success">
            <span className="summary-label">{strings.paperPreview.statusLabel}</span>
            <span className="summary-value">{strings.paperPreview.statusDone}</span>
          </div>
        )}
      </div>

      <div className="question-list">
        <h3>{strings.paperPreview.previewTitle}</h3>
        {paper.list.map((q, idx) => (
          <div className="question-card" key={q.id}>
            <div className="question-title">{questionTitle(q, idx)}</div>
            {q.options && (
              <ul className="options-list">
                {q.options.map((opt, optIdx) => (
                  <li key={optIdx} className="option-item">
                    <span className="option-badge">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="option-text">{opt}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="question-meta">
              <span className="meta-item">
                {strings.paperPreview.difficultyLabel}
                {q.difficulty}
              </span>
              <span className="meta-item answer">
                {strings.paperPreview.answerLabel}
                {q.answer}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="export-section">
        <button className="export-button" onClick={onExport}>
          {strings.paperPreview.exportButton}
        </button>
      </div>
    </div>
  )
}

