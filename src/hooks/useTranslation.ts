import { useState, useCallback } from "react"
import { translate } from "@/lib/anthropic"
import { Language, LanguageTranslation } from "@/types"

export type TranslationStatus = "idle" | "translating" | "success" | "error"

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

      const result = await translate(apiKey, text, languages)

      if (result.success) {
        setResults(result.translations)
        setStatus("success")
      } else {
        setError(result.error)
        setStatus("error")
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
