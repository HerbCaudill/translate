import { describe, it, expect, vi, beforeEach, Mock } from "vitest"
import { translate } from "./anthropic"
import Anthropic from "@anthropic-ai/sdk"

vi.mock("@anthropic-ai/sdk")

const mockParse = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  ;(Anthropic as unknown as Mock).mockImplementation(() => ({
    beta: {
      messages: { parse: mockParse },
    },
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
    const result = await translate({ apiKey: "test-key", text: "", languages })
    expect(result).toEqual({ success: false, error: "No text to translate" })
    expect(mockParse).not.toHaveBeenCalled()
  })

  it("returns empty translations for empty languages array", async () => {
    const result = await translate({ apiKey: "test-key", text: "Hello", languages: [] })
    expect(result).toEqual({ success: true, translations: [], source: "Unknown" })
    expect(mockParse).not.toHaveBeenCalled()
  })

  it("returns translations for all languages in a single request", async () => {
    const parsedOutput = {
      input: "Hello world",
      source: "en",
      translations: [
        {
          languageCode: "es",
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Hola mundo", explanation: "Standard greeting" }],
            },
          ],
        },
        {
          languageCode: "fr",
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Bonjour le monde", explanation: "Standard greeting" }],
            },
          ],
        },
      ],
    }
    mockParse.mockResolvedValue({ parsed_output: parsedOutput })

    const result = await translate({ apiKey: "test-key", text: "Hello world", languages })

    expect(mockParse).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      success: true,
      source: "en",
      alternateSources: undefined,
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
    const parsedOutput = {
      input: "Hola",
      source: "es",
      translations: [
        {
          languageCode: "es",
          meanings: [],
        },
        {
          languageCode: "fr",
          meanings: [
            { sense: "greeting", options: [{ text: "Bonjour", explanation: "French greeting" }] },
          ],
        },
      ],
    }
    mockParse.mockResolvedValue({ parsed_output: parsedOutput })

    const result = await translate({ apiKey: "test-key", text: "Hola", languages })

    expect(result).toEqual({
      success: true,
      source: "es",
      alternateSources: undefined,
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

  it("returns alternateSources when provided by API", async () => {
    const parsedOutput = {
      input: "Hola",
      source: "es",
      alternateSources: ["pt", "it"],
      translations: [
        {
          languageCode: "fr",
          meanings: [
            { sense: "greeting", options: [{ text: "Bonjour", explanation: "French greeting" }] },
          ],
        },
      ],
    }
    mockParse.mockResolvedValue({ parsed_output: parsedOutput })

    const result = await translate({ apiKey: "test-key", text: "Hola", languages })

    expect(result).toEqual({
      success: true,
      source: "es",
      alternateSources: ["pt", "it"],
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
    mockParse.mockResolvedValue({
      parsed_output: { input: "Hello", source: "en", translations: [] },
    })

    await translate({ apiKey: "test-key", text: "Hello", languages })
    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Spanish (es)"),
      }),
    )
    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("French (fr)"),
      }),
    )
  })

  it("includes sourceLanguageHint in system prompt when provided", async () => {
    mockParse.mockResolvedValue({
      parsed_output: { input: "chat", source: "fr", translations: [] },
    })

    await translate({
      apiKey: "test-key",
      text: "chat",
      languages,
      sourceLanguageHint: "fr",
    })
    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Source language hint:"),
      }),
    )
    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("French (fr)"),
      }),
    )
  })

  it("does not include sourceLanguageHint in system prompt when not provided", async () => {
    mockParse.mockResolvedValue({
      parsed_output: { input: "Hello", source: "en", translations: [] },
    })

    await translate({ apiKey: "test-key", text: "Hello", languages })
    expect(mockParse).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.not.stringContaining("Source language hint:"),
      }),
    )
  })

  it("handles rate limit with retries", async () => {
    mockParse.mockRejectedValue(createRateLimitError())

    const resultPromise = translate({ apiKey: "test-key", text: "Hello", languages })
    await flushRetries()
    const result = await resultPromise

    expect(mockParse).toHaveBeenCalledTimes(4)
    expect(result).toEqual({
      success: false,
      error: "Rate limit exceeded. Please try again later.",
    })
  })

  it("handles authentication error", async () => {
    mockParse.mockRejectedValue(
      new Anthropic.AuthenticationError(
        401,
        { type: "error", error: { type: "authentication_error", message: "Invalid" } },
        "Invalid",
        {} as Headers,
      ),
    )

    const result = await translate({ apiKey: "bad-key", text: "Hello", languages })
    expect(result).toEqual({ success: false, error: "Invalid API key" })
  })

  it("returns translations in the order defined in settings, not API response order", async () => {
    // API returns French before Spanish (different from settings order)
    const parsedOutput = {
      input: "Hello world",
      source: "en",
      translations: [
        {
          languageCode: "fr",
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Bonjour le monde", explanation: "French greeting" }],
            },
          ],
        },
        {
          languageCode: "es",
          meanings: [
            {
              sense: "greeting",
              options: [{ text: "Hola mundo", explanation: "Spanish greeting" }],
            },
          ],
        },
      ],
    }
    mockParse.mockResolvedValue({ parsed_output: parsedOutput })

    // Settings order: Spanish first, then French
    const settingsLanguages = [
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
    ]

    const result = await translate({
      apiKey: "test-key",
      text: "Hello world",
      languages: settingsLanguages,
    })

    expect(result).toEqual({
      success: true,
      source: "en",
      alternateSources: undefined,
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
