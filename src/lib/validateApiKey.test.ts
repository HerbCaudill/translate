import { describe, it, expect, vi, beforeEach } from "vitest"
import Anthropic from "@anthropic-ai/sdk"
import { validateApiKey } from "./validateApiKey"

vi.mock("@anthropic-ai/sdk")

const MockAnthropic = Anthropic as unknown as ReturnType<typeof vi.fn>

describe("validateApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns invalid for empty API key", async () => {
    const result = await validateApiKey("")
    expect(result).toEqual({ valid: false, error: "API key is required" })
  })

  it("returns invalid for whitespace-only API key", async () => {
    const result = await validateApiKey("   ")
    expect(result).toEqual({ valid: false, error: "API key is required" })
  })

  it("returns valid when API call succeeds", async () => {
    const mockCreate = vi.fn().mockResolvedValue({})
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }))

    const result = await validateApiKey("sk-ant-valid-key")

    expect(result).toEqual({ valid: true })
    expect(mockCreate).toHaveBeenCalledWith({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1,
      messages: [{ role: "user", content: "Hi" }],
    })
  })

  it("returns invalid for authentication error", async () => {
    const mockCreate = vi
      .fn()
      .mockRejectedValue(
        new Anthropic.AuthenticationError(
          401,
          { type: "error", error: { type: "authentication_error", message: "Invalid API key" } },
          "Invalid",
          {} as Headers,
        ),
      )
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }))

    const result = await validateApiKey("sk-ant-invalid-key")

    expect(result).toEqual({ valid: false, error: "Invalid API key" })
  })

  it("returns valid for rate limit error (key is valid but rate limited)", async () => {
    const mockCreate = vi
      .fn()
      .mockRejectedValue(
        new Anthropic.RateLimitError(
          429,
          { type: "error", error: { type: "rate_limit_error", message: "Rate limited" } },
          "Rate limited",
          {} as Headers,
        ),
      )
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }))

    const result = await validateApiKey("sk-ant-valid-key")

    expect(result).toEqual({ valid: true })
  })

  it("returns invalid for other API errors", async () => {
    const apiError = new Anthropic.APIError(
      500,
      { type: "error", error: { type: "server_error", message: "Server error" } },
      "Server error",
      {} as Headers,
    )
    const mockCreate = vi.fn().mockRejectedValue(apiError)
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }))

    const result = await validateApiKey("sk-ant-valid-key")

    expect(result).toEqual({ valid: false, error: `API error: ${apiError.message}` })
  })

  it("returns invalid for unknown errors", async () => {
    const mockCreate = vi.fn().mockRejectedValue(new Error("Network error"))
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }))

    const result = await validateApiKey("sk-ant-valid-key")

    expect(result).toEqual({ valid: false, error: "Failed to validate API key" })
  })
})
