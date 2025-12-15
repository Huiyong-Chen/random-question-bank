import { useEffect, useState } from 'react'
import { type QuestionBanks, type QuestionByType } from '../types/questionBanks'
import {
  getAllQuestionBanks,
  getQuestionBankByRole,
} from '../utils/indexedDB'

export const useQuestionBanks = () => {
  const [questionBanks, setQuestionBanks] = useState<QuestionBanks>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadQuestionBanks = async () => {
    try {
      setLoading(true)
      setError(null)
      const banks = await getAllQuestionBanks()
      setQuestionBanks(banks)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载题库失败')
      console.error('加载题库失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestionBanks()
  }, [])

  const getBankByRole = async (role: string): Promise<QuestionByType | null> => {
    try {
      return await getQuestionBankByRole(role)
    } catch (err) {
      console.error('获取题库失败:', err)
      return null
    }
  }

  return {
    questionBanks,
    loading,
    error,
    refresh: loadQuestionBanks,
    getBankByRole,
  }
}

