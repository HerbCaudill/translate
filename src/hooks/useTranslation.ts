import { useState, useCallback } from "react"
import { translate } from "@/lib/anthropic"
import { Language, LanguageTranslation } from "@/types"

export type TranslationStatus = "idle" | "translating" | "success" | "error"

export const useTranslation = ({ apiKey, languages }: Props) => {
  const [status, setStatus] = useState<TranslationStatus>("idle")
  const [results, setResults] = useState<LanguageTranslation[]>([])
  const [source, setSource] = useState<string | undefined>()
  const [alternateSources, setAlternateSources] = useState<string[] | undefined>()
  const [error, setError] = useState<string | undefined>()

  const translateText = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        return
      }

      setStatus("translating")
      setResults([])
      setSource(undefined)
      setAlternateSources(undefined)
      setError(undefined)

      const result = await translate({ apiKey, text, languages })

      if (result.success) {
        setResults(result.translations)
        setSource(result.source)
        setAlternateSources(result.alternateSources)
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
    setSource(undefined)
    setAlternateSources(undefined)
    setError(undefined)
  }, [])

  return {
    status,
    results,
    source,
    alternateSources,
    error,
    translate: translateText,
    reset,
  }
}

type Props = {
  apiKey: string
  languages: Language[]
}
