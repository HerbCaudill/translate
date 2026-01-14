import { useState, useCallback } from "react"
import { Settings } from "@/types"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage"

const getDefaultApiKey = () => import.meta.env.VITE_ANTHROPIC_API_KEY ?? ""

export const DEFAULT_SETTINGS: Settings = {
  apiKey: getDefaultApiKey(),
  languages: [
    { code: "en", name: "English" },
    { code: "ca", name: "Catalan" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "pt", name: "Portuguese" },
  ],
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = getItem<Settings>(STORAGE_KEYS.SETTINGS)
    const envApiKey = getDefaultApiKey()

    if (stored) {
      // Env var takes precedence over stored key
      return envApiKey ? { ...stored, apiKey: envApiKey } : stored
    }
    return DEFAULT_SETTINGS
  })

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(current => {
      const newSettings = { ...current, ...updates }
      setItem(STORAGE_KEYS.SETTINGS, newSettings)
      return newSettings
    })
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  }, [])

  return {
    settings,
    updateSettings,
    resetSettings,
  }
}

export type UseSettingsReturn = ReturnType<typeof useSettings>
