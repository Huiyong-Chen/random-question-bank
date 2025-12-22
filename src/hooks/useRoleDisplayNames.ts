import { useEffect, useState } from 'react'
import { getRoleDisplayNames } from '@utils/indexedDB'

export const useRoleDisplayNames = () => {
  const [roleDisplayNames, setRoleDisplayNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const loadDisplayNames = async () => {
    try {
      setLoading(true)
      const names = await getRoleDisplayNames()
      setRoleDisplayNames(names)
    } catch (error) {
      console.error('加载角色显示名称失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDisplayNames()
  }, [])

  return {
    roleDisplayNames,
    loading,
    refresh: loadDisplayNames,
  }
}

