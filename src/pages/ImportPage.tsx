import { useState, useEffect } from 'react'
import { QuestionBankImporter } from '@components/QuestionBankImporter'
import { useQuestionBanks } from '@hooks/useQuestionBanks'
import { useRoleDisplayNames } from '@hooks/useRoleDisplayNames'
import { strings } from '@i18n/strings'
import { getAllRoleIds, saveRoleInfo, type RoleInfo } from '@utils/indexedDB'

const ImportPage = ({ 
  onBack,
  onImportSuccess 
}: { 
  onBack: () => void
  onImportSuccess?: () => void 
}) => {
  const { refresh } = useQuestionBanks()
  const { roleDisplayNames } = useRoleDisplayNames()
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('')
  const [isCreatingRole, setIsCreatingRole] = useState(false)

  // 加载已有岗位列表
  useEffect(() => {
    getAllRoleIds().then(setAvailableRoles).catch(console.error)
  }, [])

  const handleImportSuccess = () => {
    refresh()
    // 重新加载岗位列表
    getAllRoleIds().then(setAvailableRoles).catch(console.error)
    // 通知父组件刷新
    onImportSuccess?.()
  }

  const handleCreateRole = async () => {
    const roleId = newRoleName.trim()
    const displayName = newRoleDisplayName.trim() || roleId
    
    if (!roleId || isCreatingRole) {
      return
    }
    
    // 检查角色是否已存在
    if (availableRoles.includes(roleId)) {
      alert(strings.importPage.roleExists)
      return
    }
    
    setIsCreatingRole(true)
    
    try {
      // 创建角色信息
      const roleInfo: RoleInfo = {
        id: roleId,
        displayName: displayName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      
      await saveRoleInfo(roleInfo)
      setSelectedRole(roleId)
      setNewRoleName('')
      setNewRoleDisplayName('')
      // 刷新角色列表
      await getAllRoleIds().then(setAvailableRoles).catch(console.error)
    } catch (error) {
      console.error(strings.importPage.createFailedPrefix, error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`${strings.importPage.createFailedPrefix} ${errorMessage}`)
    } finally {
      setIsCreatingRole(false)
    }
  }

  return (
    <div className="import-page">
      <div className="import-page-header">
        <button className="back-button" onClick={onBack}>
          {strings.importPage.back}
        </button>
        <h1>{strings.importPage.title}</h1>
      </div>

      <div className="import-page-content">
        <div className="role-selection-section">
          <h2>{strings.importPage.chooseOrCreate}</h2>
          <div className="role-selection">
            {availableRoles.length > 0 && (
              <div className="existing-roles">
                <label htmlFor="role-select">{strings.importPage.chooseExisting}</label>
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="select-input"
                >
                  <option value="">{strings.importPage.selectPlaceholder}</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleDisplayNames[role] ?? role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="create-role">
              <label htmlFor="new-role">{strings.importPage.createRoleLabel}</label>
              <div className="create-role-inputs">
                <div className="create-role-input">
                  <input
                    id="new-role"
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder={strings.importPage.roleIdPlaceholder}
                    className="text-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateRole()
                      }
                    }}
                  />
                </div>
                <div className="create-role-input">
                  <input
                    id="new-role-display"
                    type="text"
                    value={newRoleDisplayName}
                    onChange={(e) => setNewRoleDisplayName(e.target.value)}
                    placeholder={strings.importPage.roleDisplayPlaceholder}
                    className="text-input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateRole()
                      }
                    }}
                  />
                </div>
                <button
                  className="create-button"
                  onClick={handleCreateRole}
                  disabled={!newRoleName.trim() || isCreatingRole}
                >
                  {isCreatingRole ? strings.importPage.creating : strings.importPage.createButton}
                </button>
              </div>
            </div>
          </div>
        </div>

        {selectedRole && (
          <div className="importer-section">
            <QuestionBankImporter
              selectedRole={selectedRole}
              onImportSuccess={handleImportSuccess}
            />
          </div>
        )}

        {!selectedRole && (
          <div className="import-placeholder">
            <p>{strings.importPage.importPlaceholder}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImportPage

