import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { strings } from '@i18n/strings'
import { type Question, QuestionTypeEnum, QuestionTypeLabel } from '@/types/questionBanks'

const questionTitle = (q: Question, index: number) =>
  `${index + 1}. [${QuestionTypeLabel[q.type]}] ${q.title} (${q.score}分)`

const createBlankLines = (count: number) =>
  Array.from({ length: count }, () => new Paragraph({ text: '' }))

export const buildDoc = (
  title: string,
  questions: Question[],
  withAnswer: boolean,
) =>
  new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
          }),
          ...questions.flatMap((q, idx) => {
            const isRandomPaper = title.includes(strings.doc.randomPaperKeyword)

            const questionParts = [
              new Paragraph({
                children: [
                  new TextRun({
                    text: questionTitle(q, idx),
                    bold: true,
                  }),
                ],
              }),
            ]

            if (q.options?.length) {
              const correctAnswers = new Set(
                q.answer
                  .split(',')
                  .map((a) => a.trim())
                  .filter(Boolean),
              )

              questionParts.push(
                ...q.options.map(
                  (opt, optIdx) => {
                    const label = `${String.fromCharCode(65 + optIdx)}`
                    const isCorrect = correctAnswers.has(label) || correctAnswers.has(`${label}.`)
                    return new Paragraph({
                      indent: { left: 200 },
                      children: [
                        new TextRun({
                          text: `${label}. ${opt}`,
                          color: isCorrect ? 'FF0000' : undefined,
                        }),
                      ],
                    })
                  },
                ),
              )
            }

            if (withAnswer) {
              questionParts.push(
                new Paragraph({
                  indent: { left: 200 },
                  children: [
                    new TextRun({
                      text: `${strings.doc.answerPrefix}${q.answer}`,
                      bold: true,
                      color: 'FF0000',
                    }),
                  ],
                }),
              )
            }

            if (isRandomPaper) {
              if (q.type === QuestionTypeEnum.TrueFalse) {
                questionParts.push(...createBlankLines(1))
              } else if (q.type === QuestionTypeEnum.ShortAnswer) {
                questionParts.push(...createBlankLines(10))
              }
            }

            return questionParts
          }),
        ],
      },
    ],
  })

export const downloadDoc = async (doc: Document, filename: string) => {
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

