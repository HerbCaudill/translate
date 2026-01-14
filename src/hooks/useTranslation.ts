import { useState, useCallback } from "react"
import { translate, TranslationResult } from "@/lib/anthropic"
import { Language, LanguageTranslation } from "@/types"

export type TranslationStatus = "idle" | "translating" | "success" | "partial" | "error"

export const useTranslation = ({ apiKey, languages }: Props) => {
  const [status, setStatus] = useState<TranslationStatus>("idle")
  const [results, setResults] = useState<LanguageTranslation[]>([])
  const [error, setError] = useState<string | undefined>()

  const translateText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        return
      }

      setStatus("translating")
      setResults([])
      setError(undefined)

      const translationPromises = languages.map(
        async (language): Promise<TranslationResult & { language: Language }> => {
          const result = await translate(apiKey, text, language)
          return { ...result, language }
        },
      )

      const settled = await Promise.all(translationPromises)

      const successful: LanguageTranslation[] = []
      let firstError: string | undefined

      for (const result of settled) {
        if (result.success) {
          // Skip languages where the text is already in that language
          if ("sameLanguage" in result) {
            continue
          }
          successful.push({
            language: result.language,
            options: result.options,
          })
        } else if (!firstError) {
          firstError = result.error
        }
      }

      setResults(successful)

      if (successful.length === 0 && firstError) {
        setStatus("error")
        setError(firstError)
      } else if (firstError) {
        setStatus("partial")
        setError(firstError)
      } else {
        setStatus("success")
      }
    },
    [apiKey, languages],
  )

  const reset = useCallback(() => {
    setStatus("idle")
    setResults([])
    setError(undefined)
  }, [])

  return {
    status,
    results,
    error,
    translate: translateText,
    reset,
  }
}

type Props = {
  apiKey: string
  languages: Language[]
}
