import { useState, useCallback } from "react"
import { translate, TranslationResult } from "@/lib/anthropic"
import { Language, LanguageTranslation } from "@/types"

export type TranslationStatus = "idle" | "translating" | "success" | "partial" | "error"

export const useTranslation = ({ apiKey, languages, customPrompt }: Props) => {
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
          const result = await translate(apiKey, text, language, customPrompt)
          return { ...result, language }
        },
      )

      const settled = await Promise.all(translationPromises)

      const successful: LanguageTranslation[] = []
      let firstError: string | undefined

      for (const result of settled) {
        if (result.success) {
          successful.push({
            language: result.language,
            options: result.options,
          })
        } else if (!firstError) {
          firstError = result.error
        }
      }

      setResults(successful)

      if (successful.length === 0) {
        setStatus("error")
        setError(firstError)
      } else if (successful.length < languages.length) {
        setStatus("partial")
        setError(firstError)
      } else {
        setStatus("success")
      }
    },
    [apiKey, languages, customPrompt],
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
  customPrompt?: string
}
