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

      let completedCount = 0
      let errorCount = 0
      let firstError: string | undefined

      // Stream results as they come in - each translation updates state immediately
      const translationPromises = languages.map(async language => {
        const result = await translate(apiKey, text, language)
        completedCount++

        if (result.success) {
          // Skip languages where the text is already in that language
          if (!("sameLanguage" in result)) {
            setResults(prev => [
              ...prev,
              {
                language,
                options: result.options,
              },
            ])
          }
        } else {
          errorCount++
          if (!firstError) {
            firstError = result.error
            setError(result.error)
          }
        }

        // Update status when all translations complete
        if (completedCount === languages.length) {
          if (errorCount === languages.length) {
            setStatus("error")
          } else if (errorCount > 0) {
            setStatus("partial")
          } else {
            setStatus("success")
          }
        }
      })

      await Promise.all(translationPromises)
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
