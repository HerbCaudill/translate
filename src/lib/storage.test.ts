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
      }

      setItem(STORAGE_KEYS.SETTINGS, settings)

      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      expect(stored).toBe(JSON.stringify(settings))
    })

    it("overwrites existing value", () => {
      const initial: Settings = {
        apiKey: "old-key",
        languages: [],
      }
      const updated: Settings = {
        apiKey: "new-key",
        languages: [{ code: "de", name: "German" }],
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
            source: "en",
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
            source: "en",
          },
          createdAt: 2000,
        },
      ]

      setItem(STORAGE_KEYS.HISTORY, history)
      const result = getItem<HistoryEntry[]>(STORAGE_KEYS.HISTORY)

      expect(result).toEqual(history)
    })

    it("stores and retrieves history entries with alternateSources", () => {
      const history: HistoryEntry[] = [
        {
          id: "1",
          input: "Hola",
          translation: {
            input: "Hola",
            results: [],
            timestamp: 1000,
            source: "es",
            alternateSources: ["pt", "it"],
          },
          createdAt: 1000,
        },
      ]

      setItem(STORAGE_KEYS.HISTORY, history)
      const result = getItem<HistoryEntry[]>(STORAGE_KEYS.HISTORY)

      expect(result).toEqual(history)
      expect(result?.[0].translation.source).toBe("es")
      expect(result?.[0].translation.alternateSources).toEqual(["pt", "it"])
    })
  })
})
