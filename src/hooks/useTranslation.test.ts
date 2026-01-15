import { renderHook, waitFor, act } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { useTranslation } from "./useTranslation"
import * as anthropic from "@/lib/anthropic"

vi.mock("@/lib/anthropic", () => ({
  translate: vi.fn(),
}))

const mockTranslate = vi.mocked(anthropic.translate)

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
    mockTranslate.mockResolvedValue({
      success: true,
      options: [{ text: "Hola mundo", explanation: "Common greeting" }],
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
    expect(mockTranslate).toHaveBeenCalledTimes(2)
  })

  it("should not translate empty text", () => {
    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("")
    })

    expect(result.current.status).toBe("idle")
    expect(mockTranslate).not.toHaveBeenCalled()
  })

  it("should not translate whitespace-only text", () => {
    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("   ")
    })

    expect(result.current.status).toBe("idle")
    expect(mockTranslate).not.toHaveBeenCalled()
  })

  it("should handle translation errors", async () => {
    mockTranslate.mockResolvedValue({
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

  it("should handle partial failures (some languages succeed)", async () => {
    mockTranslate
      .mockResolvedValueOnce({
        success: true,
        options: [{ text: "Hola", explanation: "Spanish" }],
      })
      .mockResolvedValueOnce({
        success: false,
        error: "French translation failed",
      })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hello")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("partial")
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.error).toBe("French translation failed")
  })

  it("should reset state with reset()", async () => {
    mockTranslate.mockResolvedValue({
      success: true,
      options: [{ text: "Hola", explanation: "Greeting" }],
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
    mockTranslate.mockResolvedValue({
      success: true,
      options: [{ text: "Translated", explanation: "Explanation" }],
    })

    const threeLanguages = [
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
    ]

    const { result } = renderHook(() => useTranslation({ apiKey, languages: threeLanguages }))

    act(() => {
      result.current.translate("Hello")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(mockTranslate).toHaveBeenCalledTimes(3)
    expect(result.current.results).toHaveLength(3)
  })

  it("should include language info in results", async () => {
    mockTranslate.mockResolvedValue({
      success: true,
      options: [{ text: "Hola", explanation: "Common" }],
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

  it("should skip language when text is already in that language", async () => {
    // Spanish returns SAME_LANGUAGE, French returns translation
    mockTranslate
      .mockResolvedValueOnce({
        success: true,
        sameLanguage: true,
      } as anthropic.TranslationResult)
      .mockResolvedValueOnce({
        success: true,
        options: [{ text: "Bonjour", explanation: "French greeting" }],
      })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hola mundo")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    // Should have called translate for both languages
    expect(mockTranslate).toHaveBeenCalledTimes(2)
    // But results should only include French (not Spanish since it was same language)
    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].language.code).toBe("fr")
  })

  it("should return success with empty results when all languages return same language", async () => {
    mockTranslate.mockResolvedValue({
      success: true,
      sameLanguage: true,
    } as anthropic.TranslationResult)

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hello")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(mockTranslate).toHaveBeenCalledTimes(2)
    expect(result.current.results).toEqual([])
  })

  it("should stream results progressively as translations complete", async () => {
    // Create a delayed promise for the second language
    let resolveSecond: (value: anthropic.TranslationResult) => void
    const secondPromise = new Promise<anthropic.TranslationResult>(resolve => {
      resolveSecond = resolve
    })

    mockTranslate
      .mockResolvedValueOnce({
        success: true,
        options: [{ text: "Hola", explanation: "Spanish" }],
      })
      .mockReturnValueOnce(secondPromise)

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hello")
    })

    // Wait for the first result to come in
    await waitFor(() => {
      expect(result.current.results).toHaveLength(1)
    })

    // Status should still be translating since second hasn't completed
    expect(result.current.status).toBe("translating")
    expect(result.current.results[0].language.code).toBe("es")

    // Now resolve the second translation
    await act(async () => {
      resolveSecond!({
        success: true,
        options: [{ text: "Bonjour", explanation: "French" }],
      })
    })

    // Wait for completion
    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(result.current.results).toHaveLength(2)
  })
})
