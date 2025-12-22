import { lazy, Suspense, useMemo, useState } from 'react'
import './App.css'
import { PaperPreview } from '@components/PaperPreview'
import { RatioSettings } from '@components/RatioSettings'
import { RoleSelector } from '@components/RoleSelector'
import { useQuestionBanks } from '@hooks/useQuestionBanks'
import { useRoleDisplayNames } from '@hooks/useRoleDisplayNames'
import { strings } from '@i18n/strings'
import { buildDoc, downloadDoc } from '@utils/docExporter'
import { generatePaper, type GeneratedPaper, type RatioMap } from '@utils/paperGenerator'
import { QuestionTypeOrder, type QuestionType } from '@/types/questionBanks'

const ImportPage = lazy(() => import('@pages/ImportPage'))

type Page = 'home' | 'import'

const App = () => {
  const { questionBanks, loading, error, refresh } = useQuestionBanks()
  const { roleDisplayNames } = useRoleDisplayNames()
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [role, setRole] = useState<string>('')
  const [targetScore, setTargetScore] = useState(100)
  const [ratios, setRatios] = useState<RatioMap>({} as RatioMap)
  const [paper, setPaper] = useState<GeneratedPaper | null>(null)
  const [message, setMessage] = useState<string>('')

  const roles = useMemo(() => Object.keys(questionBanks), [questionBanks])

  // 根据题库自动推导当前选择的岗位（确保合法且有默认值）
  const selectedRole = useMemo(() => {
    if (roles.length === 0) return ''
    if (role && roles.includes(role)) return role
    return roles[0]
  }, [role, roles])

  const currentTypes = useMemo(
    () =>
      Object.keys(questionBanks[selectedRole] ?? {}).map((k) => Number(k)) as QuestionType[],
    [questionBanks, selectedRole],
  )

  const questionCounts = useMemo(
    () =>
      Object.fromEntries(
        currentTypes.map((type) => [
          type,
          questionBanks[selectedRole]?.[type]?.length ?? 0,
        ]),
      ),
    [currentTypes, selectedRole, questionBanks],
  )

  const totalRatio = useMemo(
    () =>
      currentTypes.reduce(
        (acc, type) => acc + (Number(ratios[type]) || 0),
        0,
      ),
    [currentTypes, ratios],
  )

  const handleRoleChange = (newRole: string) => {
    setRole(newRole)
    setPaper(null)
    setMessage('')
    setRatios({} as RatioMap)
  }

  const handleRatioChange = (type: QuestionType, value: number) => {
    setRatios((prev) => ({ ...prev, [type]: value }))
  }

  const handleGenerate = () => {
    if (!selectedRole) {
      setMessage(strings.app.messageNoRole)
      return
    }
    if (!targetScore || targetScore <= 0) {
      setMessage(strings.app.messageNoTarget)
      return
    }
    if (totalRatio <= 0) {
      setMessage(strings.app.messageNoRatio)
      return
    }

    const bank = questionBanks[selectedRole]
    if (!bank) {
      setMessage(strings.app.messageNoBank)
      return
    }

    const generated = generatePaper(bank, ratios, targetScore)

    const typePriority = (type: QuestionType) => {
      const idx = QuestionTypeOrder.indexOf(type)
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
    }

    const sortedList = [...generated.list].sort((a, b) => {
      const typeDiff = typePriority(a.type) - typePriority(b.type)
      if (typeDiff !== 0) return typeDiff
      return (a.difficulty ?? 0) - (b.difficulty ?? 0)
    })

    setPaper({ ...generated, list: sortedList })
    if (sortedList.length === 0) {
      setMessage(strings.app.messageEmptyResult)
      return
    }
    if (generated.shortfall) {
      setMessage(`${strings.app.messageShortfallPrefix} ${generated.shortfall} 分`)
      return
    }
    setMessage(strings.app.messageGenerated)
  }

  const handleExport = async () => {
    if (!paper || paper.list.length === 0) return
    const label = roleDisplayNames[selectedRole] ?? selectedRole
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .slice(0, 15)

    const examDoc = buildDoc(
      `${label} ${strings.app.exportExamSuffix} ${paper.totalScore}）`,
      paper.list,
      false,
    )
    const answerDoc = buildDoc(
      `${label} ${strings.app.exportAnswerSuffix}`,
      paper.list,
      true,
    )

    await downloadDoc(examDoc, `${label}-试卷-${timestamp}.docx`)
    await downloadDoc(answerDoc, `${label}-答案-${timestamp}.docx`)
  }


  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-state">
          <p>{strings.app.loading}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error-state">
          <p>
            {strings.app.loadError}
            {error}
          </p>
          <button className="primary-button" onClick={refresh}>
            {strings.app.retry}
          </button>
        </div>
      </div>
    )
  }

  const handleImportSuccess = () => {
    refresh()
    setCurrentPage('home')
    setMessage(strings.app.importUpdated)
  }

  // 导入页面
  if (currentPage === 'import') {
    return (
      <div className="app-container">
        <Suspense
          fallback={
            <div className="loading-state">
              <p>{strings.app.loading}</p>
            </div>
          }
        >
          <ImportPage onBack={() => setCurrentPage('home')} onImportSuccess={handleImportSuccess} />
        </Suspense>
      </div>
    )
  }

  // 首页（生成和导出）
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">{strings.app.title}</h1>
          <p className="app-subtitle">{strings.app.subtitle}</p>
        </div>
        <button
          className="import-button-header"
          onClick={() => setCurrentPage('import')}
        >
          {strings.app.importButton}
        </button>
      </header>

      <main className="app-main">
        <section className="config-section">
          <div className="section-header">
            <h2 className="section-title">{strings.app.step1Title}</h2>
          </div>
          <div className="section-content">
            {roles.length === 0 ? (
              <div className="empty-role-state">
                <p>{strings.app.emptyRole}</p>
                <button
                  className="primary-button"
                  onClick={() => setCurrentPage('import')}
                >
                  {strings.app.emptyRoleAction}
                </button>
              </div>
            ) : (
              <RoleSelector
                roles={roles}
                selectedRole={selectedRole}
                onRoleChange={handleRoleChange}
              />
            )}
          </div>
        </section>

        {selectedRole && (
          <section className="config-section">
            <div className="section-header">
              <h2 className="section-title">{strings.app.step2Title}</h2>
            </div>
            <div className="section-content">
              <RatioSettings
                currentTypes={currentTypes}
                ratios={ratios}
                totalRatio={totalRatio}
                targetScore={targetScore}
                questionCounts={questionCounts}
                onRatioChange={handleRatioChange}
                onTargetScoreChange={setTargetScore}
              />
              <div className="action-group">
                <button className="primary-button" onClick={handleGenerate}>
                  {strings.app.generateButton}
                </button>
                {message && (
                  <div className={`message ${message.includes('差') ? 'warn' : message.includes('已生成') ? 'success' : 'info'}`}>
                    {message}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="config-section">
          <div className="section-header">
            <h2 className="section-title">{strings.app.step3Title}</h2>
          </div>
          <div className="section-content">
            <PaperPreview paper={paper} onExport={handleExport} />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
