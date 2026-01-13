import { useState, useEffect, useRef } from "react"
import { useSettings } from "@/hooks/useSettings"
import { useDebounce } from "@/hooks/useDebounce"
import { useCompletionCheck } from "@/hooks/useCompletionCheck"
import { useTranslation } from "@/hooks/useTranslation"
import { ApiKeyPrompt } from "@/components/ApiKeyPrompt"
import { TranslateInput } from "@/components/TranslateInput"

export function App() {
  const { settings, updateSettings } = useSettings()
  const [inputText, setInputText] = useState("")

  const debouncedText = useDebounce(inputText, 500)

  const { status: completionStatus } = useCompletionCheck({
    text: debouncedText,
    apiKey: settings.apiKey,
    customPrompt: settings.completionPrompt,
  })

  const {
    status: translationStatus,
    results,
    translate,
    reset: resetTranslation,
  } = useTranslation({
    apiKey: settings.apiKey,
    languages: settings.languages,
    customPrompt: settings.translationPrompt,
  })

  // Track which text we've already translated to avoid re-translating
  const translatedTextRef = useRef<string>("")

  // Trigger translation when completion check returns "complete"
  useEffect(() => {
    if (
      completionStatus === "complete" &&
      debouncedText.trim() &&
      debouncedText !== translatedTextRef.current
    ) {
      translatedTextRef.current = debouncedText
      translate(debouncedText)
    }
  }, [completionStatus, debouncedText, translate])

  // Reset translation when input is cleared
  useEffect(() => {
    if (!inputText.trim()) {
      translatedTextRef.current = ""
      resetTranslation()
    }
  }, [inputText, resetTranslation])

  const handleApiKeySubmit = async (apiKey: string) => {
    updateSettings({ apiKey })
  }

  if (!settings.apiKey) {
    return <ApiKeyPrompt onSubmit={handleApiKeySubmit} />
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Translate</h1>
      <TranslateInput value={inputText} onChange={setInputText} />

      {/* Status indicators for debugging */}
      {completionStatus === "checking" && (
        <p className="text-muted-foreground text-sm">Checking if complete...</p>
      )}
      {translationStatus === "translating" && (
        <p className="text-muted-foreground text-sm">Translating...</p>
      )}

      {/* Translation results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-4">
          {results.map(result => (
            <div key={result.language.code} className="rounded-lg border p-4">
              <h2 className="mb-2 font-medium">{result.language.name}</h2>
              <div className="flex flex-col gap-2">
                {result.options.map((option, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    <p className="text-lg">{option.text}</p>
                    <p className="text-muted-foreground text-sm">{option.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
