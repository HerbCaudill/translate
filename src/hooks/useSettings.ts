import { useState, useCallback } from "react"
import { Settings } from "@/types"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage"

const getDefaultApiKey = () => import.meta.env.VITE_ANTHROPIC_API_KEY ?? ""

export const DEFAULT_SETTINGS: Settings = {
  apiKey: getDefaultApiKey(),
  languages: [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
  ],
  translationPrompt: `You are a professional translator. Translate the following text into {{language}}. Provide multiple options when there is more than one valid way to express the meaning. Briefly explain any nuances or when it would be most appropriate to use one option over another.`,
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
