import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useHistory } from "./useHistory"
import { HistoryEntry, Translation } from "@/types"

const createMockTranslation = (input: string): Translation => ({
  input,
  results: [
    {
      language: { code: "es", name: "Spanish" },
      meanings: [{ sense: "", options: [{ text: "Hola", explanation: "Standard greeting" }] }],
    },
  ],
  timestamp: Date.now(),
})

const createMockEntry = (id: string, input: string, createdAt = Date.now()): HistoryEntry => ({
  id,
  input,
  translation: createMockTranslation(input),
  createdAt,
})

describe("useHistory", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("returns empty history initially", () => {
    const { result } = renderHook(() => useHistory())
    expect(result.current.history).toEqual([])
  })

  it("loads history from localStorage on mount", () => {
    const existingHistory = [createMockEntry("1", "Hello")]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].input).toBe("Hello")
  })

  it("adds a new entry to history", () => {
    const { result } = renderHook(() => useHistory())
    const translation = createMockTranslation("Hello")

    act(() => {
      result.current.addEntry(translation)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].input).toBe("Hello")
    expect(result.current.history[0].id).toBeDefined()
  })

  it("persists new entries to localStorage", () => {
    const { result } = renderHook(() => useHistory())
    const translation = createMockTranslation("Hello")

    act(() => {
      result.current.addEntry(translation)
    })

    const stored = JSON.parse(localStorage.getItem("translate:history") || "[]")
    expect(stored).toHaveLength(1)
    expect(stored[0].input).toBe("Hello")
  })

  it("removes an entry from history", () => {
    const existingHistory = [createMockEntry("1", "Hello"), createMockEntry("2", "World")]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    act(() => {
      result.current.removeEntry("1")
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].id).toBe("2")
  })

  it("clears all history", () => {
    const existingHistory = [createMockEntry("1", "Hello"), createMockEntry("2", "World")]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    act(() => {
      result.current.clearHistory()
    })

    expect(result.current.history).toEqual([])
    expect(localStorage.getItem("translate:history")).toBe("[]")
  })

  it("finds entry by id", () => {
    const existingHistory = [createMockEntry("1", "Hello"), createMockEntry("2", "World")]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    const found = result.current.findEntry("2")
    expect(found?.input).toBe("World")

    const notFound = result.current.findEntry("999")
    expect(notFound).toBeUndefined()
  })

  it("orders history with newest entries first", () => {
    const existingHistory = [
      createMockEntry("1", "First", 1000),
      createMockEntry("2", "Second", 2000),
      createMockEntry("3", "Third", 3000),
    ]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    expect(result.current.history[0].input).toBe("Third")
    expect(result.current.history[1].input).toBe("Second")
    expect(result.current.history[2].input).toBe("First")
  })

  it("finds entry by input text", () => {
    const existingHistory = [createMockEntry("1", "Hello"), createMockEntry("2", "World")]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    const found = result.current.findByInput("World")
    expect(found?.id).toBe("2")
    expect(found?.input).toBe("World")

    const notFound = result.current.findByInput("Goodbye")
    expect(notFound).toBeUndefined()
  })

  it("finds entry by input text with whitespace trimming", () => {
    const existingHistory = [createMockEntry("1", "Hello")]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    const found = result.current.findByInput("  Hello  ")
    expect(found?.id).toBe("1")
    expect(found?.input).toBe("Hello")
  })

  it("searches history for matching entries", () => {
    const existingHistory = [
      createMockEntry("1", "Hello world"),
      createMockEntry("2", "Hello there"),
      createMockEntry("3", "Goodbye world"),
    ]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    const found = result.current.searchHistory("Hello")
    expect(found).toHaveLength(2)
    expect(found[0].input).toBe("Hello world")
    expect(found[1].input).toBe("Hello there")
  })

  it("searches history case-insensitively", () => {
    const existingHistory = [
      createMockEntry("1", "Hello World"),
      createMockEntry("2", "HELLO THERE"),
    ]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    const found = result.current.searchHistory("hello")
    expect(found).toHaveLength(2)
  })

  it("returns empty array for empty search query", () => {
    const existingHistory = [createMockEntry("1", "Hello")]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    expect(result.current.searchHistory("")).toEqual([])
    expect(result.current.searchHistory("   ")).toEqual([])
  })

  it("excludes exact matches from search results", () => {
    const existingHistory = [
      createMockEntry("1", "Hello world"),
      createMockEntry("2", "Hello"),
      createMockEntry("3", "Hello there"),
    ]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    // When searching for exactly "Hello", the entry with input "Hello" should be excluded
    const found = result.current.searchHistory("Hello")
    expect(found).toHaveLength(2)
    expect(found[0].input).toBe("Hello world")
    expect(found[1].input).toBe("Hello there")
    expect(found.find(e => e.input === "Hello")).toBeUndefined()
  })

  it("excludes exact matches case-insensitively", () => {
    const existingHistory = [createMockEntry("1", "HELLO"), createMockEntry("2", "Hello world")]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    // "hello" should not match "HELLO" exactly (case-insensitive)
    const found = result.current.searchHistory("hello")
    expect(found).toHaveLength(1)
    expect(found[0].input).toBe("Hello world")
  })

  it("updates existing entry when adding with same input", () => {
    const existingHistory = [
      createMockEntry("1", "Hello", 1000),
      createMockEntry("2", "World", 2000),
    ]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    // Add a new translation with the same input "Hello" but different results
    const newTranslation: Translation = {
      input: "Hello",
      results: [
        {
          language: { code: "fr", name: "French" },
          meanings: [
            { sense: "", options: [{ text: "Bonjour", explanation: "Updated greeting" }] },
          ],
        },
      ],
      timestamp: Date.now(),
    }

    act(() => {
      result.current.addEntry(newTranslation)
    })

    // Should still have only 2 entries, not 3
    expect(result.current.history).toHaveLength(2)

    // The "Hello" entry should now have the updated results
    const helloEntry = result.current.history.find(e => e.input === "Hello")
    expect(helloEntry).toBeDefined()
    expect(helloEntry!.translation.results[0].language.code).toBe("fr")
    expect(helloEntry!.translation.results[0].meanings[0].options[0].text).toBe("Bonjour")

    // The updated entry should keep its original ID
    expect(helloEntry!.id).toBe("1")

    // The updated entry should be moved to the top (most recent)
    expect(result.current.history[0].input).toBe("Hello")
  })

  it("updates existing entry with whitespace-trimmed input matching", () => {
    const existingHistory = [createMockEntry("1", "Hello")]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    // Add translation with extra whitespace around "Hello"
    const newTranslation: Translation = {
      input: "  Hello  ",
      results: [
        {
          language: { code: "de", name: "German" },
          meanings: [{ sense: "", options: [{ text: "Hallo", explanation: "German greeting" }] }],
        },
      ],
      timestamp: Date.now(),
    }

    act(() => {
      result.current.addEntry(newTranslation)
    })

    // Should still have only 1 entry
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].translation.results[0].language.code).toBe("de")
  })
})
