import { type QuestionByType, type QuestionBanks, type Question } from '../types/questionBanks'
import { typeToKey, keyToType } from './typeMapper'

const DB_NAME = 'QuestionBankDB'
const DB_VERSION = 2 // 基础版本号
const ROLES_STORE = 'roles'
const OLD_STORE_NAME = 'questionBanks' // 旧版本的表名，用于迁移

// 数据库升级锁，防止并发升级
let upgradeLock: Promise<void> | null = null

// 获取当前数据库版本
const getCurrentDBVersion = (): Promise<number> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME)
    request.onsuccess = () => {
      const version = request.result.version
      request.result.close()
      resolve(version || DB_VERSION)
    }
    request.onerror = () => {
      reject(new Error(`无法获取数据库版本: ${request.error?.message || '未知错误'}`))
    }
  })
}

// 角色信息类型
export type RoleInfo = {
  id: string // 角色 ID（key）
  displayName: string // 显示名称
  createdAt: number // 创建时间戳
  updatedAt: number // 更新时间戳
}

// 内部存储格式：使用英文 key
type InternalQuestionByType = Record<string, Question[]>

// 将显示格式（中文 key）转换为存储格式（英文 key）
const convertToStorageFormat = (bank: QuestionByType): InternalQuestionByType => {
  const result: InternalQuestionByType = {}
  Object.entries(bank).forEach(([type, questions]) => {
    const key = typeToKey(type)
    result[key] = questions
  })
  return result
}

// 将存储格式（英文 key）转换为显示格式（中文 key）
const convertToDisplayFormat = (bank: InternalQuestionByType): QuestionByType => {
  const result: QuestionByType = {} as QuestionByType
  Object.entries(bank).forEach(([key, questions]) => {
    const type = keyToType(key)
    result[type] = questions
  })
  return result
}

// 获取角色对应的 objectStore 名称
const getRoleStoreName = (roleId: string): string => {
  return `role_${roleId}`
}

// 初始化数据库
export const initDB = (targetVersion?: number): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // 如果没有指定版本，先获取当前版本
    const openRequest = targetVersion 
      ? indexedDB.open(DB_NAME, targetVersion)
      : indexedDB.open(DB_NAME)

    openRequest.onerror = () => {
      reject(new Error(`无法打开 IndexedDB: ${openRequest.error?.message || '未知错误'}`))
    }

    openRequest.onsuccess = () => {
      resolve(openRequest.result)
    }

    openRequest.onupgradeneeded = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      // 创建角色表
      if (!db.objectStoreNames.contains(ROLES_STORE)) {
        const rolesStore = db.createObjectStore(ROLES_STORE, { keyPath: 'id' })
        rolesStore.createIndex('displayName', 'displayName', { unique: false })
      }

      // 迁移旧数据（如果存在）
      // 注意：migrateOldData 是同步的，只创建 objectStore
      // 实际的数据迁移需要在版本变更事务完成后进行
      if (db.objectStoreNames.contains(OLD_STORE_NAME)) {
        migrateOldData(db)
        // 删除旧表（在版本变更事务中）
        db.deleteObjectStore(OLD_STORE_NAME)
      }

      // 注意：在 onupgradeneeded 中不能创建新的事务
      // 如果需要为已存在的角色创建 objectStore，需要在升级前读取角色列表
      // 这里只处理首次创建或从旧版本迁移的情况
    }
  })
}

// 迁移旧版本数据
// 注意：在 onupgradeneeded 中，我们可以创建新的事务来读写数据
// 但需要确保所有操作在版本变更事务完成前完成
const migrateOldData = (db: IDBDatabase): void => {
  // 在版本变更事务中，我们可以创建新的事务来读取旧数据
  // 但需要确保在版本变更事务完成前完成所有操作
  try {
    const readTransaction = db.transaction([OLD_STORE_NAME], 'readonly')
    const oldStore = readTransaction.objectStore(OLD_STORE_NAME)
    const request = oldStore.get('all')

    request.onsuccess = () => {
      const oldData = request.result as Record<string, InternalQuestionByType> | undefined
      if (!oldData || typeof oldData !== 'object') {
        return
      }

      // 为每个角色创建 objectStore（在版本变更事务中）
      Object.keys(oldData).forEach((roleId) => {
        // 创建角色的 objectStore
        const roleStoreName = getRoleStoreName(roleId)
        if (!db.objectStoreNames.contains(roleStoreName)) {
          db.createObjectStore(roleStoreName)
        }
      })

      // 注意：数据迁移需要在版本变更事务完成后进行
      // 这里只创建 objectStore，实际的数据迁移在 onsuccess 中异步处理
      // 但由于我们需要在版本变更事务中删除旧表，所以先不删除
      // 旧表会在下次升级时删除，或者我们可以在这里标记需要迁移
    }

    request.onerror = () => {
      console.error('迁移旧数据失败:', request.error)
    }
  } catch (error) {
    console.error('迁移旧数据时出错:', error)
  }
}

// 确保角色的 objectStore 存在（在数据库升级时创建）
// 注意：IndexedDB 只能在 onupgradeneeded 中创建 objectStore
// 如果 objectStore 不存在，需要升级数据库版本
const ensureRoleStoreExists = (db: IDBDatabase, roleId: string): boolean => {
  const storeName = getRoleStoreName(roleId)
  return db.objectStoreNames.contains(storeName)
}

// ========== 角色管理 ==========

// 获取所有角色信息
export const getAllRoles = async (): Promise<RoleInfo[]> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ROLES_STORE], 'readonly')
    const store = transaction.objectStore(ROLES_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      db.close()
      resolve(request.result || [])
    }

    request.onerror = () => {
      db.close()
      reject(new Error(`读取角色列表失败: ${request.error?.message || '未知错误'}`))
    }
  })
}

// 获取角色 ID 列表
export const getAllRoleIds = async (): Promise<string[]> => {
  const roles = await getAllRoles()
  return roles.map(role => role.id)
}

// 获取角色信息
export const getRoleInfo = async (roleId: string): Promise<RoleInfo | null> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ROLES_STORE], 'readonly')
    const store = transaction.objectStore(ROLES_STORE)
    const request = store.get(roleId)

    request.onsuccess = () => {
      db.close()
      resolve(request.result || null)
    }

    request.onerror = () => {
      db.close()
      reject(new Error(`读取角色信息失败: ${request.error?.message || '未知错误'}`))
    }
  })
}

// 升级数据库以创建新角色的 objectStore
const upgradeDBForNewRole = async (roleId: string): Promise<void> => {
  // 如果已有升级在进行，等待其完成
  if (upgradeLock) {
    await upgradeLock
    // 升级完成后，再次检查 objectStore 是否已创建
    const db = await initDB()
    if (ensureRoleStoreExists(db, roleId)) {
      db.close()
      return
    }
    db.close()
  }

  // 创建新的升级锁
  upgradeLock = (async () => {
    try {
      // 在升级前，先读取所有已存在的角色（在版本变更事务外）
      let existingRoles: RoleInfo[] = []
      try {
        existingRoles = await getAllRoles()
      } catch (error) {
        // 如果读取失败，可能是首次创建，继续执行
        console.warn('读取已有角色失败，继续创建新角色:', error)
      }
      
      // 获取当前版本并升级
      const currentVersion = await getCurrentDBVersion()
      const newVersion = currentVersion + 1
      const storeName = getRoleStoreName(roleId)
      
      await new Promise<void>((resolve, reject) => {
        // 设置超时，防止无限等待
        const timeout = setTimeout(() => {
          reject(new Error('数据库升级超时，请重试'))
        }, 10000) // 10秒超时
        
        const upgradeRequest = indexedDB.open(DB_NAME, newVersion)
        
        upgradeRequest.onupgradeneeded = (event) => {
          try {
            const newDb = (event.target as IDBOpenDBRequest).result
            
            // 确保 roles store 存在
            if (!newDb.objectStoreNames.contains(ROLES_STORE)) {
              const rolesStore = newDb.createObjectStore(ROLES_STORE, { keyPath: 'id' })
              rolesStore.createIndex('displayName', 'displayName', { unique: false })
            }
            
            // 为所有已存在的角色创建 objectStore（防止遗漏）
            existingRoles.forEach((role: RoleInfo) => {
              const roleStoreName = getRoleStoreName(role.id)
              if (!newDb.objectStoreNames.contains(roleStoreName)) {
                newDb.createObjectStore(roleStoreName)
              }
            })
            
            // 创建新角色的 objectStore
            if (!newDb.objectStoreNames.contains(storeName)) {
              newDb.createObjectStore(storeName)
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(new Error(`数据库升级过程中出错: ${error instanceof Error ? error.message : '未知错误'}`))
          }
        }
        
        upgradeRequest.onsuccess = () => {
          clearTimeout(timeout)
          upgradeRequest.result.close()
          resolve()
        }
        
        upgradeRequest.onerror = () => {
          clearTimeout(timeout)
          const errorMsg = upgradeRequest.error?.message || '未知错误'
          // 检查是否是版本冲突错误
          if (errorMsg.includes('version') || errorMsg.includes('版本')) {
            reject(new Error(`数据库版本冲突，请刷新页面后重试: ${errorMsg}`))
          } else {
            reject(new Error(`升级数据库失败: ${errorMsg}`))
          }
        }
      })
    } finally {
      // 清除升级锁
      upgradeLock = null
    }
  })()

  await upgradeLock
}

// 创建或更新角色信息
export const saveRoleInfo = async (roleInfo: RoleInfo): Promise<void> => {
  // 更新时间为当前时间
  roleInfo.updatedAt = Date.now()
  if (!roleInfo.createdAt) {
    roleInfo.createdAt = Date.now()
  }

  let db = await initDB()
  
  // 检查 objectStore 是否存在，如果不存在需要升级数据库
  if (!ensureRoleStoreExists(db, roleInfo.id)) {
    db.close()
    
    // 升级数据库以创建新角色的 objectStore
    await upgradeDBForNewRole(roleInfo.id)
    
    // 重新打开数据库
    db = await initDB()
    
    // 再次检查，确保 objectStore 已创建
    if (!ensureRoleStoreExists(db, roleInfo.id)) {
      db.close()
      throw new Error('创建角色存储表失败，请重试')
    }
  }

  // 保存角色信息
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ROLES_STORE], 'readwrite')
    const store = transaction.objectStore(ROLES_STORE)
    const request = store.put(roleInfo)

    request.onsuccess = () => {
      db.close()
      resolve()
    }

    request.onerror = () => {
      db.close()
      reject(new Error(`保存角色信息失败: ${request.error?.message || '未知错误'}`))
    }
  })
}

// 删除角色
export const deleteRole = async (roleId: string): Promise<void> => {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ROLES_STORE], 'readwrite')
    const store = transaction.objectStore(ROLES_STORE)
    const request = store.delete(roleId)

    request.onsuccess = () => {
      // 删除角色的 objectStore（需要升级数据库版本）
      // 注意：IndexedDB 不支持直接删除 objectStore，需要在新版本中删除
      // 这里我们只删除角色信息，objectStore 会在下次升级时清理
      db.close()
      resolve()
    }

    request.onerror = () => {
      db.close()
      reject(new Error(`删除角色失败: ${request.error?.message || '未知错误'}`))
    }
  })
}

// 获取角色显示名称映射
export const getRoleDisplayNames = async (): Promise<Record<string, string>> => {
  const roles = await getAllRoles()
  const result: Record<string, string> = {}
  roles.forEach(role => {
    result[role.id] = role.displayName
  })
  return result
}

// ========== 题库数据管理 ==========

// 获取指定角色的题库
export const getQuestionBankByRole = async (
  roleId: string,
): Promise<QuestionByType | null> => {
  const db = await initDB()
  const storeName = getRoleStoreName(roleId)
  
  if (!db.objectStoreNames.contains(storeName)) {
    db.close()
    return null
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get('data')

    request.onsuccess = () => {
      const internalBank: InternalQuestionByType = request.result || {}
      const displayBank = convertToDisplayFormat(internalBank)
      db.close()
      resolve(Object.keys(displayBank).length > 0 ? displayBank : null)
    }

    request.onerror = () => {
      db.close()
      reject(new Error(`读取题库数据失败: ${request.error?.message || '未知错误'}`))
    }
  })
}

// 保存指定角色的题库
export const saveQuestionBankByRole = async (
  roleId: string,
  bank: QuestionByType,
): Promise<void> => {
  let db = await initDB()
  const storeName = getRoleStoreName(roleId)

  // 如果 objectStore 不存在，尝试创建（可能是角色已创建但 objectStore 未创建）
  if (!ensureRoleStoreExists(db, roleId)) {
    // 检查角色是否存在
    const roleInfo = await getRoleInfo(roleId)
    if (!roleInfo) {
      db.close()
      throw new Error(`角色 ${roleId} 不存在，请先创建角色`)
    }
    
    db.close()
    
    // 角色存在但 objectStore 不存在，需要升级数据库创建 objectStore
    await upgradeDBForNewRole(roleId)
    
    // 重新打开数据库
    db = await initDB()
    
    // 再次检查，确保 objectStore 已创建
    if (!ensureRoleStoreExists(db, roleId)) {
      db.close()
      throw new Error(`创建角色存储表失败，请重试`)
    }
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const internalBank = convertToStorageFormat(bank)
    const request = store.put(internalBank, 'data')

    request.onsuccess = () => {
      db.close()
      resolve()
    }

    request.onerror = () => {
      db.close()
      reject(new Error(`保存题库数据失败: ${request.error?.message || '未知错误'}`))
    }
  })
}

// 获取所有题库数据（兼容旧接口）
export const getAllQuestionBanks = async (): Promise<QuestionBanks> => {
  const roles = await getAllRoles()
  const banks: QuestionBanks = {}
  
  for (const role of roles) {
    const bank = await getQuestionBankByRole(role.id)
    if (bank) {
      banks[role.id] = bank
    }
  }
  
  return banks
}

// 删除指定角色的题库
export const deleteQuestionBankByRole = async (
  roleId: string,
): Promise<void> => {
  const db = await initDB()
  const storeName = getRoleStoreName(roleId)
  
  if (!db.objectStoreNames.contains(storeName)) {
    db.close()
    return
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete('data')

    request.onsuccess = () => {
      db.close()
      resolve()
    }

    request.onerror = () => {
      db.close()
      reject(new Error(`删除题库数据失败: ${request.error?.message || '未知错误'}`))
    }
  })
}


