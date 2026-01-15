import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useHistory } from "./useHistory"
import { HistoryEntry, Translation } from "@/types"

const createMockTranslation = (input: string): Translation => ({
  input,
  results: [
    {
      language: { code: "es", name: "Spanish" },
      options: [{ text: "Hola", explanation: "Standard greeting" }],
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
    const existingHistory = [
      createMockEntry("1", "HELLO"),
      createMockEntry("2", "Hello world"),
    ]
    localStorage.setItem("translate:history", JSON.stringify(existingHistory))

    const { result } = renderHook(() => useHistory())

    // "hello" should not match "HELLO" exactly (case-insensitive)
    const found = result.current.searchHistory("hello")
    expect(found).toHaveLength(1)
    expect(found[0].input).toBe("Hello world")
  })
})
