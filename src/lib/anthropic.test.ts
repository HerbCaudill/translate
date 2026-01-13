import { describe, it, expect, vi, beforeEach, Mock } from "vitest"
import { checkCompletion, translate } from "./anthropic"
import Anthropic from "@anthropic-ai/sdk"

vi.mock("@anthropic-ai/sdk")

const mockCreate = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(Anthropic as unknown as Mock).mockImplementation(() => ({
    messages: { create: mockCreate },
  }))
})

describe("checkCompletion", () => {
  it("returns incomplete for empty text", async () => {
    const result = await checkCompletion("test-key", "")
    expect(result).toEqual({ status: "incomplete" })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns incomplete for whitespace-only text", async () => {
    const result = await checkCompletion("test-key", "   ")
    expect(result).toEqual({ status: "incomplete" })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns complete when API responds with complete", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "complete" }],
    })

    const result = await checkCompletion("test-key", "Hello world")
    expect(result).toEqual({ status: "complete" })
  })

  it("returns incomplete when API responds with incomplete", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "incomplete" }],
    })

    const result = await checkCompletion("test-key", "Hello wor")
    expect(result).toEqual({ status: "incomplete" })
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

    const result = await checkCompletion("bad-key", "Hello")
    expect(result).toEqual({ status: "error", error: "Invalid API key" })
  })

  it("handles rate limit error", async () => {
    mockCreate.mockRejectedValue(
      new Anthropic.RateLimitError(
        429,
        { type: "error", error: { type: "rate_limit_error", message: "Rate limited" } },
        "Rate limited",
        {} as Headers,
      ),
    )

    const result = await checkCompletion("test-key", "Hello")
    expect(result).toEqual({
      status: "error",
      error: "Rate limit exceeded. Please try again later.",
    })
  })

  it("uses custom prompt when provided", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "complete" }],
    })

    await checkCompletion("test-key", "Hello", "Custom prompt")
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ system: "Custom prompt" }))
  })
})

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

  it("handles rate limit error", async () => {
    mockCreate.mockRejectedValue(
      new Anthropic.RateLimitError(
        429,
        { type: "error", error: { type: "rate_limit_error", message: "Rate limited" } },
        "Rate limited",
        {} as Headers,
      ),
    )

    const result = await translate("test-key", "Hello", language)
    expect(result).toEqual({
      success: false,
      error: "Rate limit exceeded. Please try again later.",
    })
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

  it("uses custom prompt when provided", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify({ options: [] }) }],
    })

    await translate("test-key", "Hello", language, "Translate to {{language}}")
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ system: "Translate to Spanish (es)" }),
    )
  })
})
