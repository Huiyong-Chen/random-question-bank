import { useRoleDisplayNames } from '../hooks/useRoleDisplayNames'
import { strings } from '../i18n/strings'

interface RoleSelectorProps {
  roles: string[]
  selectedRole: string
  onRoleChange: (role: string) => void
}

export const RoleSelector = ({
  roles,
  selectedRole,
  onRoleChange,
}: RoleSelectorProps) => {
  const { roleDisplayNames } = useRoleDisplayNames()

  return (
    <div className="role-selector">
      <label htmlFor="role-select">{strings.roleSelector.label}</label>
      <select
        id="role-select"
        value={selectedRole}
        onChange={(e) => onRoleChange(e.target.value)}
        className="select-input"
      >
        <option value="">{strings.roleSelector.placeholder}</option>
        {roles.map((role) => (
          <option key={role} value={role}>
            {roleDisplayNames[role] ?? role}
          </option>
        ))}
      </select>
      {selectedRole && (
        <div className="role-badge">
          {strings.roleSelector.currentPrefix}
          {roleDisplayNames[selectedRole] ?? selectedRole}
        </div>
      )}
    </div>
  )
}

