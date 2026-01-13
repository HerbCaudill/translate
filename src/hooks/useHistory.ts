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
    const entry: HistoryEntry = {
      id: generateId(),
      input: translation.input,
      translation,
      createdAt: Date.now(),
    }

    setHistory(current => {
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

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
    findEntry,
  }
}

export type UseHistoryReturn = ReturnType<typeof useHistory>
