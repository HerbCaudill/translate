import { renderHook, waitFor, act } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"
import { useTranslation } from "./useTranslation"
import * as anthropic from "@/lib/anthropic"

vi.mock("@/lib/anthropic", () => ({
  translate: vi.fn(),
  detectLanguage: vi.fn(),
}))

const mockTranslate = vi.mocked(anthropic.translate)
const mockDetectLanguage = vi.mocked(anthropic.detectLanguage)

describe("useTranslation", () => {
  const apiKey = "test-api-key"
  const languages = [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
  ]
  const customPrompt = "Custom prompt {{language}}"

  beforeEach(() => {
    vi.clearAllMocks()
    // Default: detect English so no target languages are filtered out
    mockDetectLanguage.mockResolvedValue({
      success: true,
      language: { code: "en", name: "English" },
    })
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

  it("should pass custom prompt to translate function", async () => {
    mockTranslate.mockResolvedValue({
      success: true,
      options: [{ text: "Translated", explanation: "Explanation" }],
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages, customPrompt }))

    act(() => {
      result.current.translate("Test text")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(mockTranslate).toHaveBeenCalledWith(apiKey, "Test text", languages[0], customPrompt)
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
    expect(result.current.detectedLanguage).toBeUndefined()
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

  it("should detect language and return it", async () => {
    mockDetectLanguage.mockResolvedValue({
      success: true,
      language: { code: "de", name: "German" },
    })
    mockTranslate.mockResolvedValue({
      success: true,
      options: [{ text: "Translated", explanation: "Translation" }],
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Guten Tag")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    expect(result.current.detectedLanguage).toEqual({ code: "de", name: "German" })
    expect(mockDetectLanguage).toHaveBeenCalledWith(apiKey, "Guten Tag")
  })

  it("should skip translation to detected language", async () => {
    // Detect Spanish - should skip translating to Spanish
    mockDetectLanguage.mockResolvedValue({
      success: true,
      language: { code: "es", name: "Spanish" },
    })
    mockTranslate.mockResolvedValue({
      success: true,
      options: [{ text: "Translated", explanation: "Translation" }],
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("Hola mundo")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    // Should only translate to French (1 language), not Spanish
    expect(mockTranslate).toHaveBeenCalledTimes(1)
    expect(mockTranslate).toHaveBeenCalledWith(
      apiKey,
      "Hola mundo",
      { code: "fr", name: "French" },
      undefined
    )
    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].language.code).toBe("fr")
  })

  it("should translate to all languages if detection fails", async () => {
    mockDetectLanguage.mockResolvedValue({
      success: false,
      error: "Could not detect language",
    })
    mockTranslate.mockResolvedValue({
      success: true,
      options: [{ text: "Translated", explanation: "Translation" }],
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages }))

    act(() => {
      result.current.translate("xyz123")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    // Should translate to both languages since detection failed
    expect(mockTranslate).toHaveBeenCalledTimes(2)
    expect(result.current.detectedLanguage).toBeUndefined()
  })

  it("should return success with empty results when all target languages match detected", async () => {
    // Only have Spanish as a target language, and detect Spanish
    const spanishOnly = [{ code: "es", name: "Spanish" }]
    mockDetectLanguage.mockResolvedValue({
      success: true,
      language: { code: "es", name: "Spanish" },
    })

    const { result } = renderHook(() => useTranslation({ apiKey, languages: spanishOnly }))

    act(() => {
      result.current.translate("Hola")
    })

    await waitFor(() => {
      expect(result.current.status).toBe("success")
    })

    // Should not call translate at all
    expect(mockTranslate).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
    expect(result.current.detectedLanguage).toEqual({ code: "es", name: "Spanish" })
  })
})
