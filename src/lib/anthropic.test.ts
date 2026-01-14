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
  const language = { code: "es", name: "Spanish" }

  it("returns error for empty text", async () => {
    const result = await translate("test-key", "", language)
    expect(result).toEqual({ success: false, error: "No text to translate" })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns translation options on success", async () => {
    const options = [
      { text: "Hola mundo", explanation: "Standard greeting" },
      { text: "Hola a todos", explanation: "More formal" },
    ]
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ options }) }],
    })

    const result = await translate("test-key", "Hello world", language)
    expect(result).toEqual({ success: true, options })
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
    const options = [{ text: "Hola", explanation: "Standard greeting" }]
    mockCreate
      .mockRejectedValueOnce(createRateLimitError())
      .mockResolvedValueOnce({ content: [{ type: "text", text: JSON.stringify({ options }) }] })

    const resultPromise = translate("test-key", "Hello", language)
    await flushRetries()
    const result = await resultPromise

    expect(mockCreate).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ success: true, options })
  })

  it("replaces language placeholder in prompt", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ options: [] }) }],
    })

    await translate("test-key", "Hello", language)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Spanish (es)"),
      }),
    )
  })

  it("uses custom prompt when provided and appends JSON format", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ options: [] }) }],
    })

    await translate("test-key", "Hello", language, "Translate to {{language}}")
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Translate to Spanish (es)"),
      }),
    )
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("Respond in JSON format"),
      }),
    )
  })

  it("returns sameLanguage when response is SAME_LANGUAGE", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "SAME_LANGUAGE" }],
    })

    const result = await translate("test-key", "Hola", language)
    expect(result).toEqual({ success: true, sameLanguage: true })
  })
})
