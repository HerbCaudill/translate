import Anthropic from "@anthropic-ai/sdk"
import { Language, TranslationOption } from "../types"
import { SYSTEM_PROMPT } from "./prompts"
import { apiLogger } from "./logger"

const TRANSLATION_MODEL = "claude-sonnet-4-20250514"

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY_MS = 1000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const getRetryAfterMs = (error: InstanceType<typeof Anthropic.APIError>): number | undefined => {
  const headers = error.headers as Headers | undefined
  const retryAfter = headers?.get("retry-after")
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

export type TranslationResult =
  | { success: true; options: TranslationOption[] }
  | { success: true; sameLanguage: true }
  | { success: false; error: string }

const createClient = (apiKey: string): Anthropic => {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

export const translate = async (
  apiKey: string,
  text: string,
  language: Language,
): Promise<TranslationResult> => {
  if (!text.trim()) {
    return { success: false, error: "No text to translate" }
  }

  const client = createClient(apiKey)
  const systemPrompt = SYSTEM_PROMPT.replace(
    /\{\{language\}\}/g,
    `${language.name} (${language.code})`,
  )

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      apiLogger.request("messages.create", {
        model: TRANSLATION_MODEL,
        targetLanguage: language.name,
        textLength: text.length,
        attempt: attempt + 1,
      })

      const response = await client.messages.create({
        model: TRANSLATION_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
      })

      const content = response.content[0]
      if (content.type !== "text") {
        apiLogger.error("messages.create", "Unexpected response format", {
          contentType: content.type,
        })
        return { success: false, error: "Unexpected response format" }
      }

      const responseText = content.text.trim()

      // Check if the text is already in the target language
      if (responseText === "SAME_LANGUAGE") {
        apiLogger.response("messages.create", {
          targetLanguage: language.name,
          result: "sameLanguage",
        })
        return { success: true, sameLanguage: true }
      }

      // Extract JSON from potential markdown code blocks or surrounding text
      let jsonText = responseText

      // Try extracting from markdown code blocks first
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim()
      }

      // If still not valid JSON, try to find a JSON object in the text
      if (!jsonText.startsWith("{")) {
        const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/)
        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0]
        }
      }

      const parsed = JSON.parse(jsonText) as { options: TranslationOption[] }
      if (!parsed.options || !Array.isArray(parsed.options)) {
        apiLogger.error("messages.create", "Invalid response format", {
          targetLanguage: language.name,
          hasOptions: "options" in parsed,
        })
        return { success: false, error: "Invalid response format" }
      }

      apiLogger.response("messages.create", {
        targetLanguage: language.name,
        optionsCount: parsed.options.length,
      })
      return { success: true, options: parsed.options }
    } catch (error) {
      lastError = error as Error

      if (error instanceof SyntaxError) {
        apiLogger.error("messages.create", "Failed to parse translation response", {
          targetLanguage: language.name,
        })
        return { success: false, error: "Failed to parse translation response" }
      }

      if (error instanceof Anthropic.AuthenticationError) {
        apiLogger.error("messages.create", "Invalid API key")
        return { success: false, error: "Invalid API key" }
      }

      if (error instanceof Anthropic.RateLimitError) {
        if (attempt < MAX_RETRIES) {
          const retryAfterMs = getRetryAfterMs(error)
          const delayMs = retryAfterMs ?? INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt)
          apiLogger.retry(
            "messages.create",
            attempt + 1,
            MAX_RETRIES,
            delayMs,
            "Rate limit exceeded",
          )
          await sleep(delayMs)
          continue
        }
        apiLogger.error("messages.create", "Rate limit exceeded - max retries reached", {
          attempts: attempt + 1,
        })
        return { success: false, error: "Rate limit exceeded. Please try again later." }
      }

      if (error instanceof Anthropic.APIError) {
        apiLogger.error("messages.create", error.message, {
          status: error.status,
        })
        return { success: false, error: `API error: ${error.message}` }
      }
    }
  }

  apiLogger.error("messages.create", lastError?.message ?? "Failed to translate")
  return { success: false, error: lastError?.message ?? "Failed to translate" }
}
