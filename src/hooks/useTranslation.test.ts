import { renderHook, waitFor, act } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { useTranslation } from "./useTranslation"
import * as anthropic from "@/lib/anthropic"

vi.mock("@/lib/anthropic", () => ({
  translateAll: vi.fn(),
}))

const mockTranslateAll = vi.mocked(anthropic.translateAll)

describe("useTranslation", () => {
  const apiKey = "test-api-key"
  const languages = [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should return idle status initially", () => {
    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    expect(result.current.status).toBe("idle")
    expect(result.current.results).toEqual([])
    expect(result.current.error).toBeUndefined()
  })

  it("should translate when translate() is called", async () => {
    mockTranslateAll.mockResolvedValue({
      success: true,
      translations: [
        {
          language: { code: "es", name: "Spanish" },
          options: [{ text: "Hola mundo", explanation: "Common greeting" }],
        },
        {
          language: { code: "fr", name: "French" },
          options: [{ text: "Bonjour le monde", explanation: "Common greeting" }],
        },
      ],
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hello world")
    })

    expect(result.current.status).toBe("translating")

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(result.current.results).toHaveLength(2)
    expect(mockTranslateAll).toHaveBeenCalledTimes(1)
    expect(mockTranslateAll).toHaveBeenCalledWith(apiKey, "Hello world", languages)
  })

  it("should not translate empty text", () => {
    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("")
    })

    expect(result.current.status).toBe("idle")
    expect(mockTranslateAll).not.toHaveBeenCalled()
  })

  it("should not translate whitespace-only text", () => {
    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("   ")
    })

    expect(result.current.status).toBe("idle")
    expect(mockTranslateAll).not.toHaveBeenCalled()
  })

  it("should handle translation errors", async () => {
    mockTranslateAll.mockResolvedValue({
      success: false,
      error: "API error",
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hello")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("error")
    })

    expect(result.current.error).toBe("API error")
  })

  it("should reset state with reset()", async () => {
    mockTranslateAll.mockResolvedValue({
      success: true,
      translations: [
        {
          language: { code: "es", name: "Spanish" },
          options: [{ text: "Hola", explanation: "Greeting" }],
        },
      ],
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hello")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe("idle")
    expect(result.current.results).toEqual([])
    expect(result.current.error).toBeUndefined()
  })

  it("should translate to all provided languages", async () => {
    const threeLanguages = [
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
    ]

    mockTranslateAll.mockResolvedValue({
      success: true,
      translations: threeLanguages.map(lang => ({
        language: lang,
        options: [{ text: "Translated", explanation: "Explanation" }],
      })),
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages: threeLanguages }))

    act(() => {
      result.current.translate("Hello")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(mockTranslateAll).toHaveBeenCalledTimes(1)
    expect(mockTranslateAll).toHaveBeenCalledWith(apiKey, "Hello", threeLanguages)
    expect(result.current.results).toHaveLength(3)
  })

  it("should include language info in results", async () => {
    mockTranslateAll.mockResolvedValue({
      success: true,
      translations: [
        {
          language: { code: "es", name: "Spanish" },
          options: [{ text: "Hola", explanation: "Common" }],
        },
        {
          language: { code: "fr", name: "French" },
          options: [{ text: "Bonjour", explanation: "Common" }],
        },
      ],
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hello")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(result.current.results[0].language).toEqual(languages[0])
    expect(result.current.results[1].language).toEqual(languages[1])
  })

  it("should handle same-language results (filtered by translateAll)", async () => {
    // translateAll already filters same-language results
    mockTranslateAll.mockResolvedValue({
      success: true,
      translations: [
        {
          language: { code: "fr", name: "French" },
          options: [{ text: "Bonjour", explanation: "French greeting" }],
        },
      ],
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hola mundo")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(mockTranslateAll).toHaveBeenCalledTimes(1)
    // Results only include French (Spanish was same language and filtered by translateAll)
    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].language.code).toBe("fr")
  })

  it("should return success with empty results when all languages are same language", async () => {
    mockTranslateAll.mockResolvedValue({
      success: true,
      translations: [],
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hello")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(mockTranslateAll).toHaveBeenCalledTimes(1)
    expect(result.current.results).toEqual([])
  })
})
