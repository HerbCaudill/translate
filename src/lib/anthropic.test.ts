import { describe, it, expect, vi, beforeEach, Mock } from "vitest"
import { translate } from "./anthropic"
import Anthropic from "@anthropic-ai/sdk"

vi.mock("@anthropic-ai/sdk")

const mockCreate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  ;(Anthropic as unknown as Mock).mockImplementation(() => ({
    messages: { create: mockCreate },
  }))
})

const createRateLimitError = (retryAfter?: string) => {
  const headers = new Headers()
  if (retryAfter) {
    headers.set("retry-after", retryAfter)
  }
  return new Anthropic.RateLimitError(
    429,
    { type: "error", error: { type: "rate_limit_error", message: "Rate limited" } },
    "Rate limited",
    headers,
  )
}

const flushRetries = async () => {
  // Flush all pending timers from retries
  for (let i = 0; i < 4; i++) {
    await vi.runAllTimersAsync()
  }
}

describe("translate", () => {
  const languages = [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
  ]

  it("returns error for empty text", async () => {
    const result = await translate("test-key", "", languages)
    expect(result).toEqual({ success: false, error: "No text to translate" })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns empty translations for empty languages array", async () => {
    const result = await translate("test-key", "Hello", [])
    expect(result).toEqual({ success: true, translations: [] })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns translations for all languages in a single request", async () => {
    const apiResponse = {
      translations: [
        {
          languageCode: "es",
          sourceLanguage: false,
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Hola mundo", explanation: "Standard greeting" }],
            },
          ],
        },
        {
          languageCode: "fr",
          sourceLanguage: false,
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Bonjour le monde", explanation: "Standard greeting" }],
            },
          ],
        },
      ],
    }
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(apiResponse) }],
    })

    const result = await translate("test-key", "Hello world", languages)

    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      success: true,
      translations: [
        {
          language: { code: "es", name: "Spanish" },
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Hola mundo", explanation: "Standard greeting" }],
            },
          ],
        },
        {
          language: { code: "fr", name: "French" },
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Bonjour le monde", explanation: "Standard greeting" }],
            },
          ],
        },
      ],
    })
  })

  it("filters out same-language entries", async () => {
    const apiResponse = {
      translations: [
        {
          languageCode: "es",
          sourceLanguage: true,
        },
        {
          languageCode: "fr",
          sourceLanguage: false,
          meanings: [
            { sense: "greeting", options: [{ text: "Bonjour", explanation: "French greeting" }] },
          ],
        },
      ],
    }
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(apiResponse) }],
    })

    const result = await translate("test-key", "Hola", languages)

    expect(result).toEqual({
      success: true,
      translations: [
        {
          language: { code: "fr", name: "French" },
          meanings: [
            { sense: "greeting", options: [{ text: "Bonjour", explanation: "French greeting" }] },
          ],
        },
      ],
    })
  })

  it("includes all languages in system prompt", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ translations: [] }) }],
    })

    await translate("test-key", "Hello", languages)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Spanish (es)"),
      }),
    )
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("French (fr)"),
      }),
    )
  })

  it("handles rate limit with retries", async () => {
    mockCreate.mockRejectedValue(createRateLimitError())

    const resultPromise = translate("test-key", "Hello", languages)
    await flushRetries()
    const result = await resultPromise

    expect(mockCreate).toHaveBeenCalledTimes(4)
    expect(result).toEqual({
      success: false,
      error: "Rate limit exceeded. Please try again later.",
    })
  })

  it("handles authentication error", async () => {
    mockCreate.mockRejectedValue(
      new Anthropic.AuthenticationError(
        401,
        { type: "error", error: { type: "authentication_error", message: "Invalid" } },
        "Invalid",
        {} as Headers,
      ),
    )

    const result = await translate("bad-key", "Hello", languages)
    expect(result).toEqual({ success: false, error: "Invalid API key" })
  })

  it("returns translations in the order defined in settings, not API response order", async () => {
    // API returns French before Spanish (different from settings order)
    const apiResponse = {
      translations: [
        {
          languageCode: "fr",
          sourceLanguage: false,
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Bonjour le monde", explanation: "French greeting" }],
            },
          ],
        },
        {
          languageCode: "es",
          sourceLanguage: false,
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Hola mundo", explanation: "Spanish greeting" }],
            },
          ],
        },
      ],
    }
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(apiResponse) }],
    })

    // Settings order: Spanish first, then French
    const settingsLanguages = [
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
    ]

    const result = await translate("test-key", "Hello world", settingsLanguages)

    expect(result).toEqual({
      success: true,
      translations: [
        // Should be in settings order (es, fr), not API order (fr, es)
        {
          language: { code: "es", name: "Spanish" },
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Hola mundo", explanation: "Spanish greeting" }],
            },
          ],
        },
        {
          language: { code: "fr", name: "French" },
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Bonjour le monde", explanation: "French greeting" }],
            },
          ],
        },
      ],
    })
  })
})
