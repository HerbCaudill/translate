import { describe, it, expect, vi, beforeEach, Mock } from "vitest"
import { translate, translateAll } from "./anthropic"
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
  const language = { code: "es", name: "Spanish" }

  it("returns error for empty text", async () => {
    const result = await translate("test-key", "", language)
    expect(result).toEqual({ success: false, error: "No text to translate" })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns translation meanings on success", async () => {
    const meanings = [
      {
        sense: "greeting",
        options: [
          { text: "Hola mundo", explanation: "Standard greeting" },
          { text: "Hola a todos", explanation: "More formal" },
        ],
      },
    ]
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ meanings }) }],
    })

    const result = await translate("test-key", "Hello world", language)
    expect(result).toEqual({ success: true, meanings })
  })

  it("handles JSON parse error", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "not valid json" }],
    })

    const result = await translate("test-key", "Hello", language)
    expect(result).toEqual({ success: false, error: "Failed to parse translation response" })
  })

  it("handles invalid response format", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ wrong: "format" }) }],
    })

    const result = await translate("test-key", "Hello", language)
    expect(result).toEqual({ success: false, error: "Invalid response format" })
  })

  it("handles API authentication error", async () => {
    mockCreate.mockRejectedValue(
      new Anthropic.AuthenticationError(
        401,
        { type: "error", error: { type: "authentication_error", message: "Invalid" } },
        "Invalid",
        {} as Headers,
      ),
    )

    const result = await translate("bad-key", "Hello", language)
    expect(result).toEqual({ success: false, error: "Invalid API key" })
  })

  it("retries on rate limit error and eventually fails after max retries", async () => {
    mockCreate.mockRejectedValue(createRateLimitError())

    const resultPromise = translate("test-key", "Hello", language)
    await flushRetries()
    const result = await resultPromise

    // Should have tried 4 times (1 initial + 3 retries)
    expect(mockCreate).toHaveBeenCalledTimes(4)
    expect(result).toEqual({
      success: false,
      error: "Rate limit exceeded. Please try again later.",
    })
  })

  it("succeeds after rate limit retry", async () => {
    const meanings = [
      { sense: "greeting", options: [{ text: "Hola", explanation: "Standard greeting" }] },
    ]
    mockCreate
      .mockRejectedValueOnce(createRateLimitError())
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ meanings }) }] })

    const resultPromise = translate("test-key", "Hello", language)
    await flushRetries()
    const result = await resultPromise

    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ success: true, meanings })
  })

  it("replaces language placeholder in prompt", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ meanings: [] }) }],
    })

    await translate("test-key", "Hello", language)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Spanish (es)"),
      }),
    )
  })

  it("includes JSON format instructions in prompt", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ meanings: [] }) }],
    })

    await translate("test-key", "Hello", language)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Respond in JSON format"),
      }),
    )
  })

  it("includes SAME_LANGUAGE instruction in prompt", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ meanings: [] }) }],
    })

    await translate("test-key", "Hello", language)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("SAME_LANGUAGE"),
      }),
    )
  })

  it("returns sourceLanguage when response is SAME_LANGUAGE", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "SAME_LANGUAGE" }],
    })

    const result = await translate("test-key", "Hola", language)
    expect(result).toEqual({ success: true, sourceLanguage: true })
  })
})

describe("translateAll", () => {
  const languages = [
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
  ]

  it("returns error for empty text", async () => {
    const result = await translateAll("test-key", "", languages)
    expect(result).toEqual({ success: false, error: "No text to translate" })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns empty translations for empty languages array", async () => {
    const result = await translateAll("test-key", "Hello", [])
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

    const result = await translateAll("test-key", "Hello world", languages)

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

    const result = await translateAll("test-key", "Hola", languages)

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

    await translateAll("test-key", "Hello", languages)
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

    const resultPromise = translateAll("test-key", "Hello", languages)
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

    const result = await translateAll("bad-key", "Hello", languages)
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

    const result = await translateAll("test-key", "Hello world", settingsLanguages)

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
