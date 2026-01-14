import Anthropic from "@anthropic-ai/sdk"

export type ValidationResult = { valid: true } | { valid: false; error: string }

export const validateApiKey = async (apiKey: string): Promise<ValidationResult> => {
  if (!apiKey.trim()) {
    return { valid: false, error: "API key is required" }
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  try {
    await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1,
      messages: [{ role: "user", content: "Hi" }],
    })
    return { valid: true }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { valid: false, error: "Invalid API key" }
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { valid: true }
    }
    if (error instanceof Anthropic.APIError) {
      return { valid: false, error: `API error: ${error.message}` }
    }
    return { valid: false, error: "Failed to validate API key" }
  }
}
