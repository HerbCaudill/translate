import { useState, useEffect, useRef } from "react"
import { checkCompletion, CompletionResult } from "@/lib/anthropic"

export type CompletionStatus = "idle" | "checking" | "complete" | "incomplete" | "error"

export const useCompletionCheck = ({ text, apiKey, customPrompt, debounceMs = 500 }: Props) => {
  const [status, setStatus] = useState<CompletionStatus>("idle")
  const [error, setError] = useState<string | undefined>()
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Reset to idle if text or apiKey is empty
    if (!text.trim() || !apiKey) {
      setStatus("idle")
      setError(undefined)
      return
    }

    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      setStatus("checking")
      setError(undefined)

      const result: CompletionResult = await checkCompletion(apiKey, text, customPrompt)

      // Check if we were aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      if (result.status === "error") {
        setStatus("error")
        setError(result.error)
      } else {
        setStatus(result.status)
        setError(undefined)
      }
    }, debounceMs)

    return () => {
      clearTimeout(timer)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [text, apiKey, customPrompt, debounceMs])

  return { status, error }
}

type Props = {
  text: string
  apiKey: string
  customPrompt?: string
  debounceMs?: number
}
