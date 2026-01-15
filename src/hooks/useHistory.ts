import { useState, useCallback } from "react"
import { HistoryEntry, Translation } from "@/types"
import { getItem, setItem, STORAGE_KEYS } from "@/lib/storage"

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const sortByNewest = (entries: HistoryEntry[]): HistoryEntry[] => {
  return [...entries].sort((a, b) => b.createdAt - a.createdAt)
}

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const stored = getItem<HistoryEntry[]>(STORAGE_KEYS.HISTORY)
    return stored ? sortByNewest(stored) : []
  })

  const addEntry = useCallback((translation: Translation) => {
    setHistory(current => {
      // Check if an entry with the same input already exists
      const existingIndex = current.findIndex(
        entry => entry.input.trim() === translation.input.trim(),
      )

      if (existingIndex !== -1) {
        // Update the existing entry with new results and timestamp
        const updatedEntry: HistoryEntry = {
          ...current[existingIndex],
          translation,
          createdAt: Date.now(), // Update timestamp so it moves to the top
        }
        const newHistory = sortByNewest([
          updatedEntry,
          ...current.slice(0, existingIndex),
          ...current.slice(existingIndex + 1),
        ])
        setItem(STORAGE_KEYS.HISTORY, newHistory)
        return newHistory
      }

      // No existing entry, create a new one
      const entry: HistoryEntry = {
        id: generateId(),
        input: translation.input,
        translation,
        createdAt: Date.now(),
      }
      const newHistory = sortByNewest([entry, ...current])
      setItem(STORAGE_KEYS.HISTORY, newHistory)
      return newHistory
    })
  }, [])

  const removeEntry = useCallback((id: string) => {
    setHistory(current => {
      const newHistory = current.filter(entry => entry.id !== id)
      setItem(STORAGE_KEYS.HISTORY, newHistory)
      return newHistory
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    setItem(STORAGE_KEYS.HISTORY, [])
  }, [])

  const findEntry = useCallback(
    (id: string): HistoryEntry | undefined => {
      return history.find(entry => entry.id === id)
    },
    [history],
  )

  const findByInput = useCallback(
    (input: string): HistoryEntry | undefined => {
      const trimmedInput = input.trim()
      return history.find(entry => entry.input === trimmedInput)
    },
    [history],
  )

  const searchHistory = useCallback(
    (query: string): HistoryEntry[] => {
      const trimmedQuery = query.trim().toLowerCase()
      if (!trimmedQuery) return []
      return history.filter(entry => {
        const entryInput = entry.input.toLowerCase()
        // Include entries that contain the query but exclude exact matches
        return entryInput.includes(trimmedQuery) && entryInput !== trimmedQuery
      })
    },
    [history],
  )

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
    findEntry,
    findByInput,
    searchHistory,
  }
}

export type UseHistoryReturn = ReturnType<typeof useHistory>
