import Anthropic from "@anthropic-ai/sdk"
import { Language, TranslationOption } from "../types"
import { DEFAULT_COMPLETION_PROMPT, DEFAULT_TRANSLATION_PROMPT } from "./prompts"

const HAIKU_MODEL = "claude-3-5-haiku-latest"
const OPUS_MODEL = "claude-sonnet-4-20250514"

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getRetryAfterMs = (error: Anthropic.RateLimitError): number | undefined => {
  const retryAfter = error.headers?.get("retry-after")
  if (!retryAfter) return undefined

  // retry-after can be seconds (number) or HTTP-date
  const seconds = parseInt(retryAfter, 10)
  if (!isNaN(seconds)) {
    return seconds * 1000
  }

  // Try parsing as HTTP-date
  const date = Date.parse(retryAfter)
  if (!isNaN(date)) {
    return Math.max(0, date - Date.now())
  }

  return undefined
}

export type CompletionResult =
  | { status: "complete" }
  | { status: "incomplete" }
  | { status: "error"; error: string }

export type TranslationResult =
  | { success: true; options: TranslationOption[] }
  | { success: false; error: string }

const createClient = (apiKey: string): Anthropic => {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

export const checkCompletion = async (
  apiKey: string,
  text: string,
  customPrompt?: string,
): Promise<CompletionResult> => {
  if (!text.trim()) {
    return { status: "incomplete" }
  }

  const client = createClient(apiKey)
  const systemPrompt = customPrompt || DEFAULT_COMPLETION_PROMPT

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 10,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
      })

      const content = response.content[0]
      if (content.type !== "text") {
        return { status: "error", error: "Unexpected response format" }
      }

      const result = content.text.toLowerCase().trim()
      if (result.includes("complete") && !result.includes("incomplete")) {
        return { status: "complete" }
      }
      return { status: "incomplete" }
    } catch (error) {
      lastError = error as Error

      if (error instanceof Anthropic.AuthenticationError) {
        return { status: "error", error: "Invalid API key" }
      }

      if (error instanceof Anthropic.RateLimitError) {
        if (attempt < MAX_RETRIES) {
          const retryAfterMs = getRetryAfterMs(error)
          const delayMs = retryAfterMs ?? INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt)
          await sleep(delayMs)
          continue
        }
        return { status: "error", error: "Rate limit exceeded. Please try again later." }
      }

      if (error instanceof Anthropic.APIError) {
        return { status: "error", error: `API error: ${error.message}` }
      }
    }
  }

  return { status: "error", error: lastError?.message ?? "Failed to check completion" }
}

export const translate = async (
  apiKey: string,
  text: string,
  language: Language,
  customPrompt?: string,
): Promise<TranslationResult> => {
  if (!text.trim()) {
    return { success: false, error: "No text to translate" }
  }

  const client = createClient(apiKey)
  const basePrompt = customPrompt || DEFAULT_TRANSLATION_PROMPT
  const systemPrompt = basePrompt.replace("{{language}}", `${language.name} (${language.code})`)

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: OPUS_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
      })

      const content = response.content[0]
      if (content.type !== "text") {
        return { success: false, error: "Unexpected response format" }
      }

      const parsed = JSON.parse(content.text) as { options: TranslationOption[] }
      if (!parsed.options || !Array.isArray(parsed.options)) {
        return { success: false, error: "Invalid response format" }
      }

      return { success: true, options: parsed.options }
    } catch (error) {
      lastError = error as Error

      if (error instanceof SyntaxError) {
        return { success: false, error: "Failed to parse translation response" }
      }

      if (error instanceof Anthropic.AuthenticationError) {
        return { success: false, error: "Invalid API key" }
      }

      if (error instanceof Anthropic.RateLimitError) {
        if (attempt < MAX_RETRIES) {
          const retryAfterMs = getRetryAfterMs(error)
          const delayMs = retryAfterMs ?? INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt)
          await sleep(delayMs)
          continue
        }
        return { success: false, error: "Rate limit exceeded. Please try again later." }
      }

      if (error instanceof Anthropic.APIError) {
        return { success: false, error: `API error: ${error.message}` }
      }
    }
  }

  return { success: false, error: lastError?.message ?? "Failed to translate" }
}
