import { describe, it, expect, beforeEach, vi } from "vitest"
import { getItem, setItem, removeItem, STORAGE_KEYS } from "./storage"
import type { Settings, HistoryEntry } from "../types"

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe("getItem", () => {
    it("returns null when key does not exist", () => {
      const result = getItem<Settings>(STORAGE_KEYS.SETTINGS)
      expect(result).toBeNull()
    })

    it("returns parsed value when key exists", () => {
      const settings: Settings = {
        apiKey: "test-key",
        languages: [{ code: "es", name: "Spanish" }],
        translationPrompt: "Translate this",
        completionPrompt: "Check completion",
      }
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))

      const result = getItem<Settings>(STORAGE_KEYS.SETTINGS)
      expect(result).toEqual(settings)
    })

    it("returns null for invalid JSON", () => {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, "not valid json")

      const result = getItem<Settings>(STORAGE_KEYS.SETTINGS)
      expect(result).toBeNull()
    })
  })

  describe("setItem", () => {
    it("stores value as JSON", () => {
      const settings: Settings = {
        apiKey: "test-key",
        languages: [{ code: "fr", name: "French" }],
        translationPrompt: "Translate",
        completionPrompt: "Complete",
      }

      setItem(STORAGE_KEYS.SETTINGS, settings)

      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      expect(stored).toBe(JSON.stringify(settings))
    })

    it("overwrites existing value", () => {
      const initial: Settings = {
        apiKey: "old-key",
        languages: [],
        translationPrompt: "",
        completionPrompt: "",
      }
      const updated: Settings = {
        apiKey: "new-key",
        languages: [{ code: "de", name: "German" }],
        translationPrompt: "New prompt",
        completionPrompt: "New completion",
      }

      setItem(STORAGE_KEYS.SETTINGS, initial)
      setItem(STORAGE_KEYS.SETTINGS, updated)

      const result = getItem<Settings>(STORAGE_KEYS.SETTINGS)
      expect(result).toEqual(updated)
    })
  })

  describe("removeItem", () => {
    it("removes existing key", () => {
      const settings: Settings = {
        apiKey: "test",
        languages: [],
        translationPrompt: "",
        completionPrompt: "",
      }
      setItem(STORAGE_KEYS.SETTINGS, settings)

      removeItem(STORAGE_KEYS.SETTINGS)

      expect(getItem<Settings>(STORAGE_KEYS.SETTINGS)).toBeNull()
    })

    it("does nothing when key does not exist", () => {
      removeItem(STORAGE_KEYS.SETTINGS)
      expect(getItem<Settings>(STORAGE_KEYS.SETTINGS)).toBeNull()
    })
  })

  describe("with history entries", () => {
    it("stores and retrieves array of history entries", () => {
      const history: HistoryEntry[] = [
        {
          id: "1",
          input: "Hello",
          translation: {
            input: "Hello",
            results: [],
            timestamp: 1000,
          },
          createdAt: 1000,
        },
        {
          id: "2",
          input: "Goodbye",
          translation: {
            input: "Goodbye",
            results: [],
            timestamp: 2000,
          },
          createdAt: 2000,
        },
      ]

      setItem(STORAGE_KEYS.HISTORY, history)
      const result = getItem<HistoryEntry[]>(STORAGE_KEYS.HISTORY)

      expect(result).toEqual(history)
    })
  })
})
