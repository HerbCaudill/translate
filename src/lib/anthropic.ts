import Anthropic from "@anthropic-ai/sdk"
import { betaJSONSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/beta/json-schema.mjs"
import { Language, LanguageTranslation, Meaning } from "../types"
import systemPromptRaw from "./system-prompt.md?raw"
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
  | { success: true; translations: LanguageTranslation[] }
  | { success: false; error: string }

const createClient = (apiKey: string): Anthropic => {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

type ApiTranslationEntry = {
  languageCode: string
  sourceLanguage: boolean
  meanings: Meaning[]
}

const TRANSLATION_SCHEMA = {
  type: "object",
  properties: {
    input: { type: "string", description: "The original input text" },
    source: { type: "string", description: "Primary source language code" },
    alternateSources: {
      type: "array",
      items: { type: "string" },
      description: "Other languages in which the input is a valid term",
    },
    translations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          languageCode: { type: "string" },
          sourceLanguage: { type: "boolean" },
          meanings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sense: {
                  type: "string",
                  description: "Description of this sense/meaning in the target language",
                },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string", description: "The translated text" },
                      explanation: {
                        type: "string",
                        description: "Explanation in the target language of usage or nuance",
                      },
                    },
                    required: ["text", "explanation"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["sense", "options"],
              additionalProperties: false,
            },
          },
        },
        required: ["languageCode", "sourceLanguage", "meanings"],
        additionalProperties: false,
      },
    },
  },
  required: ["input", "source", "translations"],
  additionalProperties: false,
} as const

type ApiResponse = {
  input: string
  source: string
  alternateSources?: string[]
  translations: ApiTranslationEntry[]
}

export const translate = async (
  apiKey: string,
  text: string,
  languages: Language[],
): Promise<TranslationResult> => {
  if (!text.trim()) {
    return { success: false, error: "No text to translate" }
  }

  if (languages.length === 0) {
    return { success: true, translations: [] }
  }

  const client = createClient(apiKey)
  const languageList = languages.map(l => `${l.name} (${l.code})`).join(", ")
  const systemPrompt = systemPromptRaw.replace(/\{\{languages\}\}/g, languageList)

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
      // and filtering out same-language entries
      const translations: LanguageTranslation[] = []
      for (const language of languages) {
        const entry = parsed.translations.find(t => t.languageCode === language.code)
        if (!entry || entry.sourceLanguage) continue

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
      return { success: true, translations }
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
          await sleep(delayMs)
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
