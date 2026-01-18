import Anthropic from "@anthropic-ai/sdk"
import { betaJSONSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/beta/json-schema.mjs"
import { Language, LanguageTranslation } from "../types"
import systemPromptRaw from "./system-prompt.md?raw"
import { apiLogger } from "./logger"
import { getRetryAfterMs } from "./getRetryAfterMs"
import { MAX_RETRIES, TRANSLATION_MODEL, INITIAL_RETRY_DELAY_MS } from "./constants"
import type { ApiResponse, TranslationResult } from "@/types"
import { TRANSLATION_SCHEMA } from "./response-schema"

const createClient = (apiKey: string): Anthropic => {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

export type TranslateOptions = {
  apiKey: string
  text: string
  languages: Language[]
  /** Optional hint for which language to treat as the source */
  sourceLanguageHint?: string
}

export const translate = async (options: TranslateOptions): Promise<TranslationResult> => {
  const { apiKey, text, languages, sourceLanguageHint } = options

  if (!text.trim()) {
    return { success: false, error: "No text to translate" }
  }

  if (languages.length === 0) {
    return { success: true, translations: [], source: "Unknown" }
  }

  const client = createClient(apiKey)
  const languageList = languages.map(l => `${l.name} (${l.code})`).join(", ")

  // Build the system prompt with optional sourceLanguageHint
  let systemPrompt = systemPromptRaw.replace(/\{\{languages\}\}/g, languageList)

  // Handle the sourceLanguageHint template
  if (sourceLanguageHint) {
    // Find the language name for the hint
    const hintLanguage = languages.find(l => l.code === sourceLanguageHint)
    const hintText =
      hintLanguage ? `${hintLanguage.name} (${hintLanguage.code})` : sourceLanguageHint
    systemPrompt = systemPrompt
      .replace(/\{\{#if sourceLanguageHint\}\}/g, "")
      .replace(/\{\{\/if\}\}/g, "")
      .replace(/\{\{sourceLanguageHint\}\}/g, hintText)
  } else {
    // Remove the conditional block when no hint is provided
    systemPrompt = systemPrompt.replace(
      /\{\{#if sourceLanguageHint\}\}[\s\S]*?\{\{\/if\}\}\n?/g,
      "",
    )
  }

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      apiLogger.request("messages.parse", {
        model: TRANSLATION_MODEL,
        targetLanguages: languages.map(l => l.name),
        textLength: text.length,
        attempt: attempt + 1,
      })

      const response = await client.beta.messages.parse({
        model: TRANSLATION_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: text }],
        output_format: betaJSONSchemaOutputFormat<typeof TRANSLATION_SCHEMA>(TRANSLATION_SCHEMA),
      })

      const parsed = response.parsed_output as ApiResponse | undefined
      if (!parsed) {
        apiLogger.error("messages.parse", "No parsed output in response")
        return { success: false, error: "Failed to parse translation response" }
      }

      // Map the API response back to our types, maintaining the order from settings
      // and filtering out the source language
      const translations: LanguageTranslation[] = []
      for (const language of languages) {
        const entry = parsed.translations.find(t => t.languageCode === language.code)
        if (!entry || language.code === parsed.source) continue

        if (entry.meanings) {
          translations.push({
            language,
            meanings: entry.meanings,
          })
        }
      }

      apiLogger.response("messages.parse", {
        targetLanguages: languages.map(l => l.name),
        translationsCount: translations.length,
      })
      return {
        success: true,
        translations,
        source: parsed.source,
        alternateSources: parsed.alternateSources,
      }
    } catch (error) {
      lastError = error as Error

      if (error instanceof SyntaxError) {
        apiLogger.error("messages.parse", "Failed to parse translation response", {
          targetLanguages: languages.map(l => l.name),
        })
        return { success: false, error: "Failed to parse translation response" }
      }

      if (error instanceof Anthropic.AuthenticationError) {
        apiLogger.error("messages.parse", "Invalid API key")
        return { success: false, error: "Invalid API key" }
      }

      if (error instanceof Anthropic.RateLimitError) {
        if (attempt < MAX_RETRIES) {
          const retryAfterMs = getRetryAfterMs(error)
          const delayMs = retryAfterMs ?? INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt)
          apiLogger.retry(
            "messages.parse",
            attempt + 1,
            MAX_RETRIES,
            delayMs,
            "Rate limit exceeded",
          )
          await ((ms: number) => new Promise(resolve => setTimeout(resolve, ms)))(delayMs)
          continue
        }
        apiLogger.error("messages.parse", "Rate limit exceeded - max retries reached", {
          attempts: attempt + 1,
        })
        return { success: false, error: "Rate limit exceeded. Please try again later." }
      }

      if (error instanceof Anthropic.APIError) {
        apiLogger.error("messages.parse", error.message, {
          status: error.status,
        })
        return { success: false, error: `API error: ${error.message}` }
      }
    }
  }

  apiLogger.error("messages.parse", lastError?.message ?? "Failed to translate")
  return { success: false, error: lastError?.message ?? "Failed to translate" }
}
