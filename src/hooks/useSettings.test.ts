import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSettings, DEFAULT_SETTINGS } from "./useSettings"
import { STORAGE_KEYS } from "@/lib/storage"

describe("useSettings", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("returns default settings when localStorage is empty", () => {
    const { result } = renderHook(() => useSettings())

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
  })

  it("loads settings from localStorage on mount", () => {
    const savedSettings = {
      apiKey: "test-key",
      languages: [{ code: "es", name: "Spanish" }],
      translationPrompt: "custom translation prompt",
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(savedSettings))

    const { result } = renderHook(() => useSettings())

    expect(result.current.settings).toEqual(savedSettings)
  })

  it("updates settings and persists to localStorage", () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSettings({ apiKey: "new-key" })
    })

    expect(result.current.settings.apiKey).toBe("new-key")

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)!)
    expect(stored.apiKey).toBe("new-key")
  })

  it("merges partial updates with existing settings", () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSettings({ apiKey: "my-key" })
    })

    act(() => {
      result.current.updateSettings({
        languages: [{ code: "fr", name: "French" }],
      })
    })

    expect(result.current.settings.apiKey).toBe("my-key")
    expect(result.current.settings.languages).toEqual([{ code: "fr", name: "French" }])
  })

  it("resets settings to defaults", () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSettings({ apiKey: "custom-key" })
    })

    act(() => {
      result.current.resetSettings()
    })

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
  })

  it("clears apiKey from localStorage on reset", () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.updateSettings({ apiKey: "secret-key" })
    })

    act(() => {
      result.current.resetSettings()
    })

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)!)
    expect(stored.apiKey).toBe("")
  })
})
