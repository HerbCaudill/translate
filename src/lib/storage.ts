export const STORAGE_KEYS = {
  SETTINGS: "translate:settings",
  HISTORY: "translate:history",
  SELECTED_TAB: "translate:selected-tab",
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export const getItem = <T>(key: StorageKey): T | null => {
  const value = localStorage.getItem(key)
  if (value === null) {
    return null
  }
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export const setItem = <T>(key: StorageKey, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const removeItem = (key: StorageKey): void => {
  localStorage.removeItem(key)
}
